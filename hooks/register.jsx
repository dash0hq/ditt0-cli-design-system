import { setElements, setTheme, setFocused, setRedraw } from '../components/elements.js'
import { setCopy, copierOf } from '../components/copy.js'
import { isMeasure, receive } from '../components/measure.js'
import { isPromqlTool, unitOf, serverOf } from '../connectors/dash0/promql.js'
import { queriesFor as overviewQueries, DASH0_PARSERS, REFRESH_MS } from '../connectors/dash0/overview.js'
import { queriesFor as tracingQueries, SELECTS as TRACING_SELECTS } from '../connectors/dash0/tracing.js'
import { livePageOf, registerLivePage, showLivePage, hideLivePage, livePageHandlers } from '../connectors/live-page.js'
import { remember, track, setAuto } from '../connectors/dash0/live.js'
import { Dash0QueryResult } from '../components/pages/dash0-query-result/dash0-query-result.jsx'
import { Dash0Dashboard } from '../components/pages/dash0-dashboard/dash0-dashboard.jsx'
import { Dash0Tracing } from '../components/pages/dash0-tracing/dash0-tracing.jsx'
import { HelloTabs } from '../components/pages/hello-tabs/hello-tabs.jsx'
import { Gallery, Canvas, ALL, navSpace, navFits, NAV_DITT0, clampNav, clampPage } from '../components/pages/gallery/gallery.jsx'
import { frame, ease, targetPose, restPose } from '../components/atoms/logo/ditt0-body.js'
import { storyById } from '../components/pages/gallery/stories.js'
import { Tour, STEPS as TOUR_STEPS, STEP_MS as TOUR_STEP_MS } from '../components/pages/tour/tour.jsx'
import { SpecPage } from '../components/pages/spec-page/spec-page.jsx'
import { registerSpecPages, SHOW_TOOL, PERSES_COMMAND } from '../connectors/spec-page.js'

// Where each page draws in Claude Code. The pages decide what they draw; this module only mounts them

const PANE = 'hello-tabs'
const GALLERY = 'ditt0'
// The tour that plays itself, /book-tour: the step it is at, and its timer while it plays
const TOUR = 'ditt0-tour'
let tourStep = 0
let tourTimer = null
// A pane drawing one story alone: ditt0-story:<story id>, and ?theme=light for the light colours.
// The component tests mount these
const STORY = 'ditt0-story:'

let tab = 'one'
let count = 0
let sessionTheme = 'dark'
// Where the gallery is: the open component and its doc (null until read), and the last action each story raised
// and the args its actions have set, by story id (a story's meta.argsOnAction)
let gallery = { componentId: null, docs: null, shown: [], storyActions: {}, storyArgs: {} }
let loadingDocs = null
// The rows the gallery's pinned sidebar has scrolled its own list by, and the rows its page has scrolled by
let navOffset = 0
// The gallery's sidebar: open, or collapsed to its ☰ so the page takes the pane's width. null until the person
// presses the ☰: then it opens where it leaves the page room (navFits) and starts collapsed in a narrower pane.
// navShown is how it was last drawn
let navOpen = null
let navShown = true
let pageOffset = 0
// Ditt0 at the foot of the gallery's sidebar (NavDitt0): repainted ten times a second while the gallery is open,
// breathing and blinking, and hopping for HOP_S after a press. Its clock starts at the gallery's first terminal
// render and stops when the gallery closes (its Close, /ditt0-close, or the person's), or once its Raster has refused DITT0_DENIES frames in a row (not
// mounted: the next render starts it again). A blit that fails is let go, never thrown. A clock the host refused
// says nothing, so one that has not ticked for DITT0_STALE_MS is started again at the next render
const DITT0_MS = 100
const HOP_S = 0.6
const DITT0_DENIES = 30
const DITT0_STALE_MS = 3000
let ditt0 = { timer: null, pose: restPose(), seconds: 0, hopAt: -1, denied: 0, tickedAt: 0 }
function stopDitt0() {
    try { ditt0.timer?.cancel() } catch {}
    ditt0 = { ...ditt0, timer: null, denied: 0 }
}
function tickDitt0($) {
    ditt0.tickedAt = Date.now()
    ditt0.seconds += DITT0_MS / 1000
    const doneFor = ditt0.hopAt >= 0 ? ditt0.seconds - ditt0.hopAt : -1
    if (doneFor > HOP_S) ditt0.hopAt = -1
    const mood = ditt0.hopAt >= 0 ? 'done' : 'idle'
    ditt0.pose = ease(ditt0.pose, targetPose(mood, ditt0.seconds))
    try {
        const cells = frame({ pose: ditt0.pose, mood, seconds: ditt0.seconds, doneFor: ditt0.hopAt >= 0 ? doneFor : -1 })
        Promise.resolve($.ui.blit({ requestId: GALLERY, key: NAV_DITT0, cells })).then((result) => {
            ditt0.denied = result?.deny ? ditt0.denied + 1 : 0
            if (ditt0.denied >= DITT0_DENIES) stopDitt0()
        }, () => {})
    } catch {}
}
function startDitt0($) {
    if (ditt0.timer && Date.now() - ditt0.tickedAt < DITT0_STALE_MS) return
    stopDitt0()
    ditt0.tickedAt = Date.now()
    try { ditt0.timer = $.clock.every(DITT0_MS, () => tickDitt0($)) } catch { ditt0.timer = null }
}
const hopDitt0 = () => { ditt0.hopAt = ditt0.seconds }

// Reads the open component's doc page, then draws again
function loadDocs($) {
    const component = ALL.find(c => c.id === gallery.componentId) ?? ALL[0]
    if (loadingDocs === component.id) return
    loadingDocs = component.id
    $.fs.read(`${$.plugin.root}/${component.docs}`).catch(() => '').then((docs) => {
        if (loadingDocs !== component.id) return
        loadingDocs = null
        gallery = { ...gallery, docs: docs ?? '' }
        $.ui.invalidate('ui.render')
    })
}

// The Dash0 server Claude last called, for a live page opened without one to ask the same one
let lastDash0 = null
// The server a live page asks: the one its command names, else the last Dash0 server Claude called, else claude.ai's
const dash0Server = (named) => named || lastDash0 || 'claude.ai Dash0'

// The args a story's action sets, kept under its id
const withArgs = (storyArgs, id, update) => update ? { ...storyArgs, [id]: { ...storyArgs[id], ...update } } : storyArgs

// A function drawing a finished Dash0 promql call as its page, or null for any other call. The result keeps
// itself current (connectors/dash0/live.js): the page draws its latest data, and says how current it is
// call: a ToolResult's props, or a ToolGroup's call (which carries its input)
async function promqlPage($, call) {
    if (call.isErrored || call.isRunning || !isPromqlTool(call.tool)) return null
    // A host without a clock (a test that doesn't mock one) reads the time from Date
    const entry = track($, call, await $.clock.now().catch(() => Date.now()))
    if (!entry) return null
    const live = entry.id ? { id: entry.id, canRefresh: Boolean(entry.args), auto: entry.auto, at: entry.updatedAt ?? entry.seenAt, failed: entry.failed } : undefined
    const onAutoChange = (auto) => { setAuto($, entry, auto); $.ui.invalidate('ui.render') }
    return () => <Dash0QueryResult result={entry.result} unit={unitOf(entry.args?.query)} live={live} onAutoChange={onAutoChange} />
}

// The live pages (connectors/live-page.js), each a pane of its own: what opens it, what it loads and what it draws
const LIVE_PAGES = [
    {
        id: 'dash0-dashboard',
        command: 'dash0-dashboard',
        // Its Examples page in the gallery, which draws it live too
        story: 'features-dash0-pages-services-overview',
        description: 'Open a live Dash0 services overview; optionally name the Dash0 MCP server',
        title: 'Dash0 services overview',
        refreshMs: REFRESH_MS,
        server: dash0Server,
        queries: overviewQueries,
        parsers: DASH0_PARSERS,
        draw: (page, handlers) => <Dash0Dashboard data={page.data} range={page.range} at={page.at} auto={page.auto} failed={page.failed} refreshing={Boolean(page.loading)} {...handlers} />,
    },
    {
        id: 'dash0-tracing',
        command: 'dash0-tracing',
        story: 'features-dash0-pages-tracing',
        description: "Open Dash0's Tracing explorer, live; optionally name the Dash0 MCP server",
        title: 'Dash0 tracing',
        // A minute's steps, so a new bar comes every minute
        range: '15m',
        // RED first, as the explorer opens; a span dragged across a chart asks the spans list again
        view: 'red',
        selects: TRACING_SELECTS,
        refreshMs: REFRESH_MS,
        server: dash0Server,
        queries: tracingQueries,
        parsers: DASH0_PARSERS,
        draw: (page, handlers) => <Dash0Tracing data={page.data} range={page.range} at={page.at} auto={page.auto} failed={page.failed} refreshing={Boolean(page.loading)} view={page.view} selection={page.selection} {...handlers} />,
    },
]

// Each live page's state, which its pane and the gallery's Examples page share
const livePages = LIVE_PAGES.map(livePageOf)

export function register(on) {
    // The live pages: each a slash command opening a pane that asks Dash0 on open and every 30 seconds
    // (connectors/live-page.js). /dash0-dashboard dash0-prod asks that server
    for (const page of livePages) registerLivePage(on, page)

    // Pages from a spec, plain JSON (connectors/spec-page.js): $.ditt0.open(spec) from this or another mod, and the
    // ditt0_show tool for Claude, each in a pane of its own, ditt0-page-<id>
    registerSpecPages(on, {
        server: dash0Server,
        draw: (page, handlers) => <SpecPage spec={page.page} data={{ ...page.inline, ...page.data }} range={page.range} at={page.asks ? page.at : page.inlineAt} auto={page.auto} failed={page.failed} refreshing={Boolean(page.loading)} {...handlers} />,
    })

    on('session.start', async ($, e, next) => {
        await $.command.register({ name: 'hello-tabs', description: 'Open the hello tabs pane' })
        await $.command.register({ name: 'book', description: 'Open the Ditt0 book: every component, its docs and live examples' })
        for (const { command, description } of LIVE_PAGES) await $.command.register({ name: command, description })
        await $.command.register({ name: 'book-tour', description: 'Play a tour of Ditt0: the design system, its charts, live pages, plugging in and generative UI' })
        await $.command.register({ name: 'ditt0-close', description: 'Close every Ditt0 pane: the gallery, the Dash0 overview, the stories' })
        // A Perses dashboard from a file, as a live page (connectors/perses.js)
        await $.command.register(PERSES_COMMAND)
        // Generative UI: Claude composes a live page from Ditt0 blocks (connectors/spec-page.js)
        await $.tool.register(SHOW_TOOL).catch(() => {})
        const saved = await $.store.get('count')
        if(saved) {
            count = saved
        }
        // Dash0's colours come in a dark and a light set: draw with the one that fits the person's theme
        const theme = (await $.config.list()).find(row => row.key === 'theme')
        sessionTheme = String(theme?.value ?? 'dark')
        setTheme(sessionTheme)
        return next(e)
    })

    // Runs when you type /hello-tabs
    on('command.run', { command: 'hello-tabs' }, async ($) => {
        // Open the pane, give it the keyboard, and let Esc close it
        await $.ui.open({ id: PANE, title: 'Hello tabs', focus: true, closeOnEscape: true })
        // Print nothing in the transcript
        return {}
    })

    // Runs when you type /book
    on('command.run', { command: 'book' }, async ($) => {
        // Wide and tall enough for a chart with its hover card, and a doc page with its stories in it. 90 columns: a dock
        // takes at most 45% of the window, so that is a 200-column terminal's
        await $.ui.open({ id: GALLERY, title: 'Ditt0 components', focus: true, closeOnEscape: true, columns: 90, rows: 40 })
        return {}
    })

    // Runs when you type /ditt0-close: every pane this plugin has open closes, whole
    on('command.run', { command: 'ditt0-close' }, async ($) => {
        const panes = await $.ui.panes()
        stopDitt0()
        await Promise.all(panes.map(pane => $.ui.close({ id: pane.id })))
        return { text: panes.length ? `Closed ${panes.length === 1 ? '1 pane' : `${panes.length} panes`}` : 'No Ditt0 pane is open' }
    })

    // Runs when you type /book-tour: the tour opens at its start and steps on by itself every TOUR_STEP_MS
    on('command.run', { command: 'book-tour' }, async ($) => {
        tourStep = 0
        tourTimer?.cancel()
        await $.ui.open({ id: TOUR, title: 'Ditt0 tour', focus: true, closeOnEscape: true, columns: 90, rows: 50 })
        tourTimer = $.clock.every(TOUR_STEP_MS, () => {
            if (tourStep >= TOUR_STEPS.length - 1) { tourTimer?.cancel(); tourTimer = null; return }
            tourStep += 1
            $.ui.invalidate('ui.render')
        })
        return {}
    })

    // The tour closed: it stops stepping
    on('ui.close', { id: TOUR }, async ($, e, next) => {
        tourTimer?.cancel()
        tourTimer = null
        return next(e)
    }).catch(($, e, next) => next(e))

    on('ui.render', { component: 'Pane', requestId: TOUR }, async ($, e) => {
        setElements($.ui.resolve(e), e.surface)
        setRedraw(() => $.ui.invalidate('ui.render'))
        setCopy(copierOf($))
        return <Tour
            step={tourStep}
            onPrevious={() => { tourStep = Math.max(0, tourStep - 1); $.ui.invalidate('ui.render') }}
            onNext={() => { tourStep = Math.min(TOUR_STEPS.length - 1, tourStep + 1); $.ui.invalidate('ui.render') }}
            onClose={() => { void $.ui.close({ id: TOUR }) }}
        />
    })

    // The gallery closed: a live page it showed stops asking, unless its own pane is open
    on('ui.close', { id: GALLERY }, async ($, e, next) => {
        for (const page of livePages) hideLivePage(page)
        stopDitt0()
        return next(e)
    }).catch(($, e, next) => next(e))

    // Tab, the arrows or a click moved the focus ring in one of this plugin's panes: draw again, so the control it
    // lands on lights its border (Button, Switch)
    on('ui.focus', async ($, e, next) => {
        if (setFocused(e.element)) $.ui.invalidate('ui.render')
        return next(e)
    }).catch(($, e, next) => next(e))

    // The gallery scrolls itself, so its sidebar never moves (Gallery's scroll): the wheel over the sidebar scrolls
    // its list, anything else (the wheel over the page, the arrows, the page keys) the page. Home and End ask for
    // the whole tree, which is the window's height here, so they go to the page's top or end
    on('ui.scroll', { requestId: GALLERY }, async ($, e, next) => {
        const overNav = navShown && e.pointer && e.pointer.column < navSpace(navShown) - 1
        const by = !e.pointer && Math.abs(e.by) >= e.contentRows ? Math.sign(e.by) * 1e6 : e.by
        const moved = overNav ? clampNav(navOffset + by, e.bodyRows) : clampPage(pageOffset + by, e.bodyRows)
        if (moved !== (overNav ? navOffset : pageOffset)) {
            if (overNav) navOffset = moved
            else pageOffset = moved
            $.ui.invalidate('ui.render')
        }
        return {}
    }).catch(($, e, next) => next(e))

    // A chart's measure region posts the width of the Box it sits in: keep it, and draw again when it changed.
    // A chart that answers the pointer also posts what it is over, a drag's columns and zoom keys: its handlers run
    on('ui.message', async ($, e, next) => {
        if (!isMeasure(e)) return next(e)
        if (receive(e.element, e.data)) $.ui.invalidate('ui.render')
        return {}
    })

    // A promql call's arguments, kept so its result, drawn as a ToolResult without them, can run again
    on('tool.call', async ($, e, next) => {
        if (isPromqlTool(e.tool)) remember(e.tool_use_id, e)
        // The Dash0 server Claude uses, for /dash0-dashboard to ask the same one
        if (/^mcp__.*dash0.*__/i.test(e.tool)) lastDash0 = serverOf(e.tool)
        return next(e)
    }).catch(($, e, next) => next(e))

    // A Dash0 promql result draws as a chart under its tool row; Claude still reads the table.
    // A call drawn on its own row has a ToolResult
    on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
        const page = await promqlPage($, e.props)
        if (!page) return next(e)
        setElements($.ui.resolve(e), e.surface)
        setRedraw(() => $.ui.invalidate('ui.render'))
        setCopy(copierOf($))
        return page()
    })

    // Claude Code folds MCP calls into one line ("Called Dash0"), which draws no ToolResult:
    // keep that line and draw the page under it for each finished promql call in the group
    on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
        const pages = (await Promise.all(e.props.calls.map(call => promqlPage($, call)))).filter(Boolean)
        if (!pages.length || e.props.isExpanded) return next(e)
        const line = await next(e)
        setElements($.ui.resolve(e), e.surface)
        setRedraw(() => $.ui.invalidate('ui.render'))
        setCopy(copierOf($))
        const { Box } = $.ui.resolve(e)
        return <Box flexDirection="column">{[line, ...pages.map(page => page())]}</Box>
    })

    on('ui.render', { component: 'Pane' }, async ($, e, next) => {
        // Ask Claude Code to run this hook again
        const redraw = () => $.ui.invalidate('ui.render')

        if (e.requestId === GALLERY) {
            setElements($.ui.resolve(e), e.surface)
            setRedraw(() => $.ui.invalidate('ui.render'))
            setCopy(copierOf($))
            if (gallery.docs === null) loadDocs($)
            // An Examples page with a live page behind it draws that page itself, live, in place of its doc and
            // stories: it asks Dash0 while it is open in the gallery, and stops once the gallery leaves it
            const componentId = gallery.componentId ?? ALL[0].id
            const live = livePages.find(page => page.spec.story === componentId)
            for (const page of livePages) if (page !== live) hideLivePage(page)
            if (live) showLivePage($, live)
            // Ditt0 animates in the terminal only, where it is a Raster; a phone draws no sidebar
            if (e.surface === 'terminal') startDitt0($)
            navShown = navOpen ?? navFits(e.props.bodyColumns)
            return (
                <Gallery
                    {...gallery}
                    live={live ? live.spec.draw(live, livePageHandlers($, live, undefined)) : undefined}
                    scroll={e.props.scroll}
                    navOffset={navOffset}
                    pageOffset={clampPage(pageOffset, e.props.scroll?.bodyRows ?? 0)}
                    // A close of the plugin's own reaches no ui.close hook of its own: Ditt0 stops here
                    onClose={() => { stopDitt0(); void $.ui.close({ id: GALLERY }) }}
                    onDitt0={hopDitt0}
                    navOpen={navShown}
                    onNavToggle={() => { navOpen = !navShown; redraw() }}
                    onComponent={(componentId) => { gallery = { ...gallery, componentId, docs: null, shown: [] }; pageOffset = 0; redraw() }}
                    // A story past the page's budget: show it, with the one shown before, and no more, so the page draws
                    onShow={(id) => { gallery = { ...gallery, shown: [...(gallery.shown ?? []).slice(-1), id] }; redraw() }}
                    onAction={(action, update, id) => {
                        gallery = { ...gallery, storyActions: { ...gallery.storyActions, [id]: action }, storyArgs: withArgs(gallery.storyArgs, id, update) }
                        redraw()
                    }}
                />
            )
        }

        if (e.requestId?.startsWith(STORY)) {
            const [id, query = ''] = e.requestId.slice(STORY.length).split('?')
            const entry = storyById(id)
            if (!entry) return next(e)
            setElements($.ui.resolve(e), e.surface)
            setRedraw(() => $.ui.invalidate('ui.render'))
            setCopy(copierOf($))
            // Draw in the theme the id asks for, then put the person's back
            setTheme(new URLSearchParams(query).get('theme') ?? sessionTheme)
            const drawn = (
                <Canvas
                    entry={entry}
                    lastAction={gallery.storyActions[id]}
                    args={gallery.storyArgs[id]}
                    onAction={(action, update) => { gallery = { ...gallery, storyActions: { ...gallery.storyActions, [id]: action }, storyArgs: withArgs(gallery.storyArgs, id, update) }; redraw() }}
                />
            )
            setTheme(sessionTheme)
            return drawn
        }

        // Leave other mods' panes alone
        if (e.requestId !== PANE) return next(e)
        // Hand this render's elements to the components
        setElements($.ui.resolve(e), e.surface)
        setRedraw(() => $.ui.invalidate('ui.render'))
        setCopy(copierOf($))
        return (
            <HelloTabs
                tab={tab}
                count={count}
                onTabChange={(name) => { tab = name; redraw() }}
                onCount={async () => {
                    count += 1
                    redraw()
                    // Save the count so it's there after a restart
                    await $.store.set('count', count)
                }}
            />
        )
    })
}
