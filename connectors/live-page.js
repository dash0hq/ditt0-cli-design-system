import { setElements, setRedraw } from '../components/elements.js'
import { setCopy, copierOf } from '../components/copy.js'

// A live page in its own pane: a slash command opens it, it asks its source on open and every refreshMs while
// Auto-refresh is on, keeps what each panel last read when a refresh fails, and stops asking when the pane closes.
// Any app's data plugs in this way (connectors/README.md): a connector that loads plain data, a page component that
// draws it, and this, which keeps them live. The Services overview and Tracing pages are two of them.
//
// spec:
// - id: the pane's id; command, description: the slash command that opens it; title, columns, rows: the pane's
// - range: the range it opens on ('1h'); refreshMs: how often it asks again (Dash0's own 30 seconds)
// - server(args): which MCP server to ask, from what the command was typed with
// - queries(range, now): every panel's MCP call, { key: { tool, args } }, a pure function of the range and the time
//   (connectors/dash0/overview.js queriesFor, tracing.js); parsers: { tool: (content) => data or null }, how each
//   tool's answer is read (overview.js DASH0_PARSERS). The page asks them all at once (loadPanels).
//   queries(range, now, { selection }) also takes the span picked on a chart, for the panels that follow it
// - view: the view it opens on, for a page that offers several (Tracing's 'red'); none for one that doesn't
// - selects: the panels a picked span asks again (Tracing's ['spans']); the others keep the range
// - draw(state, { onRangeChange, onAutoChange, onViewChange, onSelectionChange, onClose }): the page, from state
//   { range, data, at, auto, failed, view, selection }
// The command itself the hooks module registers at session.start, from spec.command and spec.description: the
// engine takes one session.start hook a plugin, and keeps nothing a register call like this returns
// A page's state, made from its spec before it is registered, so another site can draw it live too (the gallery:
// showLivePage, livePageHandlers, hideLivePage). The engine keeps nothing a call taking `on` returns, so the state
// is made here and handed to registerLivePage
export const livePageOf = (spec) => ({ spec, server: null, range: spec.range ?? '1h', data: {}, at: null, auto: true, failed: [], view: spec.view ?? null, selection: null, timer: null, loading: false, inPane: false, inGallery: false })

export function registerLivePage(on, page) {
    const spec = page.spec

    on('command.run', { command: spec.command }, async ($, e) => {
        page.server = spec.server(e.args.trim())
        page.data = {}
        page.at = null
        page.failed = []
        page.selection = null
        page.inPane = true
        await $.ui.open({ id: spec.id, title: spec.title, focus: true, closeOnEscape: true, columns: spec.columns ?? 90, rows: spec.rows ?? 60 })
        void refreshLivePage($, page)
        startLivePage($, page)
        return {}
    })

    // Closed, by its Close, Esc, /ditt0-close or the engine: stop asking
    on('ui.close', { id: spec.id }, async ($, e, next) => {
        page.inPane = false
        if (!page.inGallery) stopLivePage(page)
        return next(e)
    }).catch(($, e, next) => next(e))

    on('ui.render', { component: 'Pane', requestId: spec.id }, async ($, e) => {
        setElements($.ui.resolve(e), e.surface)
        setRedraw(() => $.ui.invalidate('ui.render'))
        setCopy(copierOf($))
        return spec.draw(page, livePageHandlers($, page, () => { void $.ui.close({ id: spec.id }) }))
    })
}

// What a live page's controls run, wherever it is drawn: a range starts it over, Auto-refresh starts or stops its
// timer, a view only draws again (every view's panels are asked every time); a span picked on a chart, { from, to }
// in ms or null for none, asks the panels that follow it (spec.selects) again, and every refresh after keeps it;
// onClose closes what shows it (its pane, or nothing in the gallery)
export function livePageHandlers($, page, onClose) {
    const redraw = () => $.ui.invalidate('ui.render')
    return {
            // Another range draws nothing it can't vouch for: loading until its answers come
            onRangeChange: (range) => {
                Object.assign(page, { range, data: {}, at: null, failed: [], selection: null })
                redraw()
                void refreshLivePage($, page)
                startLivePage($, page)
            },
            onAutoChange: (auto) => {
                page.auto = auto
                startLivePage($, page)
                if (auto) void refreshLivePage($, page)
                redraw()
            },
            onViewChange: (view) => {
                page.view = view
                redraw()
            },
            onSelectionChange: (selection) => {
                const keys = page.spec.selects ?? []
                page.selection = selection
                page.data = { ...page.data, ...Object.fromEntries(keys.map(key => [key, null])) }
                redraw()
                void refreshSelected($, page, keys)
            },
            onClose,
        }
}

// The gallery opened the page: it asks now, on the default server, and keeps asking, as its pane would
export function showLivePage($, page) {
    if (page.inGallery) return
    page.inGallery = true
    page.server ??= page.spec.server('')
    void refreshLivePage($, page)
    if (!page.timer) startLivePage($, page)
}

// The gallery left it, or closed: it stops asking, unless its own pane is still open
export function hideLivePage(page) {
    if (!page.inGallery) return
    page.inGallery = false
    if (!page.inPane) stopLivePage(page)
}

// Asks for every panel again and draws the answers. One refresh at a time for a range (loading: the range being
// asked); an answer for a range the page has left is dropped
export async function refreshLivePage($, page) {
    const range = page.range
    if (page.loading === range) return
    page.loading = range
    // Draw it asking, so the page shows a refresh is under way
    $.ui.invalidate('ui.render')
    try {
        // A host without a clock (a test that doesn't mock one) reads the time from Date
        const now = await $.clock.now().catch(() => Date.now())
        const selection = page.selection
        const read = await loadPanels($, page.server, page.spec.queries(range, now, { selection }), page.spec.parsers, page, now)
        // A span picked while it asked: the panels that follow it keep what that pick asked for
        if (page.selection !== selection) for (const key of page.spec.selects ?? []) {
            read.data[key] = page.data[key]
            read.failed = read.failed.filter(k => k !== key)
        }
        if (page.range === range) Object.assign(page, read)
    } finally {
        if (page.loading === range) page.loading = false
    }
    $.ui.invalidate('ui.render')
}

// Asks only the panels that follow the picked span, and draws them; the others, and when the page last read them,
// stay as they are. An answer for a span the page has left is dropped
async function refreshSelected($, page, keys) {
    const { range, selection } = page
    const now = await $.clock.now().catch(() => Date.now())
    const queries = page.spec.queries(range, now, { selection })
    const read = await loadPanels($, page.server, Object.fromEntries(keys.map(key => [key, queries[key]])), page.spec.parsers, page, now)
    if (page.range !== range || page.selection !== selection) return
    page.data = { ...page.data, ...read.data }
    page.failed = [...page.failed.filter(key => !keys.includes(key)), ...read.failed]
    $.ui.invalidate('ui.render')
}

// Asks again every refreshMs while Auto-refresh is on, and not while it's off or the pane is closed
export function stopLivePage(page) {
    page.timer?.cancel()
    page.timer = null
}
export function startLivePage($, page) {
    stopLivePage(page)
    if (page.auto) page.timer = $.clock.every(page.spec.refreshMs, () => { void refreshLivePage($, page) })
}

// Asks every panel's query at once through the server, and reads each answer with its tool's parser. last: what the
// page showed before, { data, at }; a panel whose query fails or answers what can't be read keeps its last data,
// and is named in failed. at: when the data came (now), kept from last when every query failed.
// Resolves to { data: { key: read }, at, failed }
export async function loadPanels($, server, queries, parsers, last = {}, now) {
    const answers = await Promise.all(Object.entries(queries).map(async ([key, { tool, args }]) => {
        try {
            const answer = await $.mcp.call(server, tool, args)
            return [key, answer && !answer.isError ? parsers[tool]?.(answer.content) ?? null : null]
        } catch {
            return [key, null]
        }
    }))
    const failed = answers.filter(([, read]) => !read).map(([key]) => key)
    return {
        data: Object.fromEntries(answers.map(([key, read]) => [key, read ?? last.data?.[key] ?? null])),
        at: failed.length === answers.length ? last.at ?? null : now,
        failed,
    }
}
