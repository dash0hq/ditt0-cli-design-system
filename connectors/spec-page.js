import { DASH0_PARSERS, DATASET, RANGES, REFRESH_MS, durationOf, rangeOf, windowOf } from './dash0/overview.js'
import { parsePromql } from './dash0/promql.js'
import { persesPage } from './perses.js'
import { livePageOf, livePageHandlers, refreshLivePage, startLivePage, stopLivePage } from './live-page.js'
import { setElements, setRedraw } from '../components/elements.js'
import { setCopy, copierOf } from '../components/copy.js'

// Spec pages: a page described as plain JSON (a Ditt0Page, types/index.d.ts), drawn from Ditt0 components
// (components/pages/spec-page) and kept live by live-page.js. Another mod opens one through $.ditt0.open(spec), and
// Claude through the ditt0_show tool. Only JSON crosses: blocks name what to draw, and either carry their data or
// say what to ask Dash0 for it. The pure part (normalizeSpec, queriesOf, inlineOf, applyUpdate) has no `$`, so a
// test checks it without a server

// A spec page's pane id (a pane id is letters, digits, _ or -, up to 64): prefixed, so a page named 'overview' never takes another pane's place
export const PANE_PREFIX = 'ditt0-page-'
export const paneOf = (id) => `${PANE_PREFIX}${id}`
// The block types a spec may use
export const BLOCK_TYPES = ['heading', 'text', 'markdown', 'stats', 'timeseries', 'bars', 'pie', 'gauge', 'gantt', 'diagram', 'table', 'badge', 'tags', 'link', 'row', 'column', 'card']
const CONTAINERS = ['row', 'column', 'card']
const MIN_REFRESH_MS = 5_000

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const str = (v) => typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)
// Only plain JSON crosses: a value that doesn't survive a JSON round trip (a function, a cycle) is dropped
const plain = (v) => { try { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)) } catch { return undefined } }

// A block's queries: [{ promql, name? }], each asked under its own key (SUB), their series drawn together, each
// named by its name ('{{device}} - CPU', the series' labels put in), as a Perses panel's queries are
const queriesListOf = (block) => Array.isArray(block.queries) ? block.queries.filter(q => isObject(q) && str(q.promql).trim()) : []
export const SUB = '~'
export const subsOf = (block) => block.promql ? [] : queriesListOf(block).map((q, i) => ({ ...q, key: `${block.key}${SUB}${i}` }))

// What a block asks for, if anything: a promql shorthand, its queries, or a { tool, args } call; a spans table asks
// getSpans
export const askedOf = (block) => block.promql || queriesListOf(block).length || isObject(block.query) || (block.type === 'table' && block.spans)

// The spec, checked and given a key per data block (its id, else its place: b0, b2.1; a stat its block's key and
// its index, b1.0), with what was wrong in it. A spec with no id, title or blocks can't open: problems says why and
// spec is null. An unknown block type is left out and named in problems, so the rest still draws
// A spec may instead give a Perses dashboard, perses (an object, or its JSON or YAML), and variables to set
// ({ name: value or values }): the page is that dashboard's (perses.js), and id, title, range, server, dataset and
// refreshMs given beside it win over the dashboard's
export function normalizeSpec(input) {
    const problems = []
    let spec = plain(input)
    if (isObject(spec) && spec.perses !== undefined) {
        const { perses, variables, ...given } = spec
        const { spec: page, problems: found } = persesPage(perses, { ...given, variables })
        problems.push(...found.map(p => `perses: ${p}`))
        if (!page) return { spec: null, problems }
        spec = { ...page, ...Object.fromEntries(Object.entries(given).filter(([k, v]) => k !== 'blocks' && v !== undefined && v !== '')) }
    }
    if (!isObject(spec)) return { spec: null, problems: ['The spec must be an object: { id, title, blocks }'] }
    const refused = []
    if (!/^[A-Za-z0-9_-]{1,53}$/.test(str(spec.id))) refused.push('id must be 1 to 53 letters, digits, _ or -')
    if (!str(spec.title)) refused.push('title is required')
    if (!Array.isArray(spec.blocks)) refused.push('blocks must be an array')
    if (refused.length) return { spec: null, problems: [...problems, ...refused] }
    const seen = new Set()
    const walk = (blocks, path) => blocks.flatMap((block, i) => {
        const at = `${path}${i}`
        if (!isObject(block) || !BLOCK_TYPES.includes(block.type)) {
            problems.push(`blocks ${at}: unknown type ${JSON.stringify(block?.type)}; one of ${BLOCK_TYPES.join(', ')}`)
            return []
        }
        const key = typeof block.id === 'string' && block.id ? block.id : `b${at}`
        if (seen.has(key)) problems.push(`blocks ${at}: id ${key} is used twice; the later one shares its data`)
        seen.add(key)
        const out = { ...block, key }
        if (CONTAINERS.includes(block.type)) out.blocks = walk(Array.isArray(block.blocks) ? block.blocks : [], `${at}.`)
        if (block.type === 'stats') out.items = (Array.isArray(block.items) ? block.items : []).filter(isObject).map((item, j) => {
            const itemKey = typeof item.id === 'string' && item.id ? item.id : `${key}.${j}`
            if (seen.has(itemKey)) problems.push(`blocks ${at}.${j}: id ${itemKey} is used twice; the later one shares its data`)
            seen.add(itemKey)
            return { ...item, key: itemKey }
        })
        return [out]
    })
    const range = RANGES.some(r => r.value === spec.range) ? spec.range : '1h'
    const refreshMs = Number.isFinite(spec.refreshMs) ? Math.max(MIN_REFRESH_MS, spec.refreshMs) : REFRESH_MS
    return {
        spec: { id: spec.id, title: str(spec.title), server: typeof spec.server === 'string' ? spec.server : '', dataset: str(spec.dataset) || DATASET, range, refreshMs, blocks: walk(spec.blocks, '') },
        problems,
    }
}

// Every block and stat of a spec, containers opened, in order
export const blocksOf = (blocks) => blocks.flatMap(b => [b, ...(b.blocks ? blocksOf(b.blocks) : []), ...(b.items ?? [])])

// A promql query with the range's own values put in: $step, $__rate_interval and $__interval are its step (5m for 1h),
// $__interval_ms that in ms; $__range is the range itself (1h), $__range_s and $__range_ms it in seconds and ms.
// Each also as ${name}, as Perses and Grafana write them
export const withStep = (query, range) => {
    const { ms, step } = rangeOf(range)
    const values = { step: durationOf(step), __rate_interval: durationOf(step), __interval: durationOf(step), __interval_ms: String(step), __range: durationOf(ms), __range_s: String(ms / 1000), __range_ms: String(ms) }
    return query.replace(/\$\{(step|__rate_interval|__interval_ms|__interval|__range_s|__range_ms|__range)\}|\$(step|__rate_interval|__interval_ms|__interval|__range_s|__range_ms|__range)\b/g, (_, a, b) => values[a ?? b])
}

// The call a promql query makes for a range ending now
const promqlCall = (query, block, range, now, dataset) => {
    const step = durationOf(rangeOf(range).step)
    return { tool: 'promql', args: { query: withStep(str(query), range), dataset: str(block.dataset) || dataset, timeRange: windowOf(range, now), timeSeriesOptions: { resolution: step } } }
}

// The call one block or stat makes for a range ending now, or null for one that carries its own data
// dataset: the page's, for a block that names none
export const queryOf = (block, range, now, dataset = DATASET) => {
    if (block.promql) return promqlCall(block.promql, block, range, now, dataset)
    if (isObject(block.query) && typeof block.query.tool === 'string') return { tool: block.query.tool, args: isObject(block.query.args) ? block.query.args : {} }
    if (block.type === 'table' && block.spans) {
        const spans = isObject(block.spans) ? block.spans : {}
        return {
            tool: 'getSpans',
            args: {
                dataset: str(spans.dataset) || dataset,
                timeRange: { from: `now-${range}`, to: 'now' },
                filters: Array.isArray(spans.filters) ? spans.filters : [{ key: 'otel.span.kind', operator: 'is', value: 'SERVER' }],
                pagination: { limit: Math.min(50, Math.max(1, Number(spans.limit) || 15)) },
            },
        }
    }
    return null
}

// Every call a spec's page makes, { key: { tool, args } }, for live-page.js: a block with queries makes one per query,
// each under its sub key (subsOf)
export const queriesOf = (spec) => (range, now) => Object.fromEntries(blocksOf(spec.blocks).flatMap(b => {
    if (!askedOf(b)) return []
    if (subsOf(b).length) return subsOf(b).map(q => [q.key, promqlCall(q.promql, b, range, now, spec.dataset)])
    return [[b.key, queryOf(b, range, now, spec.dataset)]]
}).filter(([, q]) => q))

// A promql answer with no series ('No results returned') reads as no data, not as a failed query: a dashboard made
// for metrics this dataset doesn't have draws empty, and says so
export const emptyPromql = (output) => {
    const text = Array.isArray(output) ? output.filter(b => b?.type === 'text').map(b => b.text).join('\n') : typeof output === 'string' ? output : ''
    if (!/^# Series Attribute Sets$/m.test(text) || !/^# Query Results per Series ID$/m.test(text) || !/No results returned/.test(text)) return null
    return { series: [], times: [], link: text.match(/\[Open [^\]]*\]\((https:\/\/[^)\s]+)\)/)?.[1] ?? null }
}
export const SPEC_PARSERS = { ...DASH0_PARSERS, promql: (output) => parsePromql(output) ?? emptyPromql(output) }

// The data the blocks carry themselves, by key: a chart's { series, times }, bars' { bars } or { series, labels },
// a table's { columns, rows }, a stat's { value } or { values }. What $.ditt0.update pushes replaces it
export const inlineOf = (spec) => Object.fromEntries(blocksOf(spec.blocks).flatMap(b => {
    if (askedOf(b)) return []
    if (isObject(b.data)) return [[b.key, b.data]]
    if (b.type === 'timeseries' && Array.isArray(b.series)) return [[b.key, { series: b.series, times: b.times }]]
    if (b.type === 'bars' && (Array.isArray(b.bars) || Array.isArray(b.series))) return [[b.key, { bars: b.bars, series: b.series, labels: b.labels }]]
    if (b.type === 'pie' && Array.isArray(b.slices)) return [[b.key, { slices: b.slices }]]
    if (b.type === 'gauge' && ('value' in b || Array.isArray(b.series))) return [[b.key, Array.isArray(b.series) ? { series: b.series } : { value: b.value }]]
    if (b.type === 'gantt' && Array.isArray(b.tasks)) return [[b.key, { tasks: b.tasks }]]
    if (b.type === 'table' && Array.isArray(b.rows)) return [[b.key, { columns: b.columns, rows: b.rows }]]
    if (!b.type && ('value' in b || 'values' in b)) return [[b.key, { value: b.value, values: b.values }]]
    return []
}))

// A spec's page state, as live-page.js keeps it, plus what the blocks carry (inline) and when that last changed.
// server: the MCP server its queries ask
export function specPageOf(spec, server) {
    const queries = queriesOf(spec)
    const page = livePageOf({ id: paneOf(spec.id), title: spec.title, range: spec.range, refreshMs: spec.refreshMs, server: () => server, queries, parsers: SPEC_PARSERS })
    return Object.assign(page, { server, inline: inlineOf(spec), inlineAt: null, asks: Object.keys(queries(spec.range, 0)).length, page: spec })
}

// New blocks and data pushed by a mod. blocks replaces the page's blocks (data kept by key); data merges, by block
// key, over what they carry. Returns the problems, [] when it all went in
export function applyUpdate(page, input, now) {
    const problems = []
    const update = plain(input) ?? {}
    if (Array.isArray(update.blocks)) {
        const { spec, problems: found } = normalizeSpec({ ...page.page, blocks: update.blocks })
        problems.push(...found)
        if (spec) {
            const queries = queriesOf(spec)
            Object.assign(page, { page: spec, inline: { ...page.inline, ...inlineOf(spec) }, asks: Object.keys(queries(spec.range, 0)).length })
            page.spec = { ...page.spec, queries }
        }
    }
    if (isObject(update.data)) {
        const keys = new Set(blocksOf(page.page.blocks).map(b => b.key))
        for (const [key, value] of Object.entries(update.data)) {
            if (!keys.has(key)) { problems.push(`data ${key}: no block has that id`); continue }
            page.inline = { ...page.inline, [key]: value }
        }
    }
    page.inlineAt = now
    return problems
}

// The pages open now, by spec id. Made here, not in a call taking `on`: the engine keeps nothing such a call returns
export const specPages = new Map()

// Opens a spec's page in a pane of its own, asks its queries at once and every refreshMs, and answers
// { id, opened, problems? }; opened is false where nothing can draw a pane (claude -p). The same id again replaces
// the page. server: the MCP server to ask when the spec names none
export async function openSpecPage($, input, server) {
    const { spec, problems } = normalizeSpec(input)
    if (!spec) return { id: str(input?.id), opened: false, problems }
    const old = specPages.get(spec.id)
    if (old) stopLivePage(old)
    const now = await $.clock.now().catch(() => Date.now())
    const page = specPageOf(spec, spec.server || server)
    page.inlineAt = now
    page.inPane = true
    specPages.set(spec.id, page)
    let opened = true
    try {
        await $.ui.open({ id: paneOf(spec.id), title: spec.title, focus: true, closeOnEscape: true, columns: 90, rows: 60 })
    } catch (err) {
        opened = false
        problems.push(`The pane did not open: ${String(err?.message ?? err)}`)
    }
    if (page.asks) {
        void refreshLivePage($, page)
        if (opened) startLivePage($, page)
    }
    return problems.length ? { id: spec.id, opened, problems } : { id: spec.id, opened }
}

// Pushes new data or blocks to an open page and draws it again: { id, updated, problems? }
export async function updateSpecPage($, input) {
    const page = specPages.get(str(input?.id))
    if (!page) return { id: str(input?.id), updated: false, problems: ['No Ditt0 page is open with that id'] }
    const now = await $.clock.now().catch(() => Date.now())
    const problems = applyUpdate(page, input, now)
    $.ui.invalidate('ui.render')
    return problems.length ? { id: page.page.id, updated: true, problems } : { id: page.page.id, updated: true }
}

// Closes a page's pane, which stops its timer (closedSpecPage): { id, closed }
export async function closeSpecPage($, input) {
    const id = str(input?.id)
    if (!specPages.has(id)) return { id, closed: false }
    await $.ui.close({ id: paneOf(id) }).catch(() => {})
    closedSpecPage(paneOf(id))
    return { id, closed: true }
}

// A pane closed, by its Close, Esc, /ditt0-close or the engine: a spec page's stops asking and is forgotten
export const closedSpecPage = (paneId) => {
    if (!String(paneId ?? '').startsWith(PANE_PREFIX)) return
    const id = paneId.slice(PANE_PREFIX.length)
    const page = specPages.get(id)
    if (!page) return
    stopLivePage(page)
    specPages.delete(id)
}

export const specPageOfPane = (paneId) => String(paneId ?? '').startsWith(PANE_PREFIX) ? specPages.get(paneId.slice(PANE_PREFIX.length)) ?? null : null

// What a spec page's tool answer tells Claude: what opened, and anything left out
export const showAnswer = (result) => [
    result.opened ? `Opened the Ditt0 page "${result.id}" in a pane.` : result.problems && !result.id ? 'The page did not open.' : `The Ditt0 page "${result.id}" is ready, but no pane can be drawn here.`,
    ...(result.problems ?? []).map(p => `- ${p}`),
].join('\n')

// The ditt0_show tool's input: a Ditt0Page, as JSON schema. Kept loose on purpose: blocks are checked by normalizeSpec,
// which names what it left out
const BLOCK_SCHEMA = {
    type: 'object',
    required: ['type'],
    properties: {
        type: { type: 'string', enum: BLOCK_TYPES },
        id: { type: 'string', description: 'Key for this block, to push data to it later' },
        text: { type: 'string', description: 'heading, text, markdown' },
        level: { type: 'string', enum: ['h1', 'h2', 'h3'], description: 'heading (default h3)' },
        color: { type: 'string', description: "text: default, subtle, error, warning, info, healthy. badge: default, critical, attention, success, severe, primary" },
        title: { type: 'string', description: 'timeseries, bars, pie, gantt, diagram, table, card' },
        unit: { type: 'string', description: "timeseries, bars, stats: seconds, milliseconds, bytes, percent, ratio, or text like /s" },
        promql: { type: 'string', description: 'timeseries, bars, pie (a slice per series, at its last sample: sum by (label)), gauge, table, stat item: a Dash0 PromQL query; its time range and step come from the page range. Write [$step] for the rate window' },
        queries: { type: 'array', description: 'in place of promql, several queries drawn together: [{ promql, name? }], name a series name with {{label}} put in' },
        calculation: { type: 'string', enum: ['last', 'first', 'last-number', 'first-number', 'mean', 'sum', 'min', 'max'], description: 'stat item, gauge, pie, bars, table: how a series becomes one value (default last)' },
        thresholds: { type: 'array', description: "stat item, gauge: [{ value, color: 'warning' | 'error' | 'healthy' | 'info' }], the status a value reaches" },
        min: { type: 'number', description: 'gauge (default 0)' },
        max: { type: 'number', description: 'gauge (default 100 for percent, 1 for ratio, else above the value)' },
        value: { type: 'number', description: 'gauge inline' },
        query: { type: 'object', description: 'timeseries, bars, table: an MCP call { tool, args } (tools with a parser: promql, getSpans, getServiceCatalog, getFailedChecks)' },
        lineType: { type: 'string', enum: ['braille', 'box', 'bars'] },
        stacked: { type: 'boolean' },
        series: { type: 'array', description: 'timeseries inline: [{ name, values: (number|null)[] }]; bars: grouped series' },
        times: { type: 'array', items: { type: 'string' }, description: 'timeseries inline: a HH:MM label per value' },
        bars: { type: 'array', description: 'bars inline: [{ label, value }]' },
        slices: { type: 'array', description: 'pie inline: [{ label, value }], parts of one whole' },
        variant: { type: 'string', enum: ['round', 'squares'], description: "pie: 'round' (default), or 'squares', a 10×10 waffle for when the exact share matters" },
        tasks: { type: 'array', description: 'gantt inline: [{ label, section?, start, end?, milestone? }], times in ms or ISO; a milestone has a start alone' },
        source: { type: 'string', description: 'diagram: Mermaid source, flowchart (TD or LR), sequenceDiagram, stateDiagram-v2 or classDiagram' },
        labels: { type: 'array', items: { type: 'string' } },
        orientation: { type: 'string', enum: ['vertical', 'horizontal'] },
        alt: { type: 'string', description: 'bars: what the chart shows, in words' },
        columns: { type: 'array', description: 'table inline: [{ key, label, align? }]' },
        rows: { type: 'array', description: 'table inline: [{ [key]: string | { text, badge } | { text, status } }]' },
        spans: { type: 'object', description: "table: spans from Dash0, { filters?, limit?, sort?: 'newest' | 'slowest' } (default the newest 15 server spans; slowest sorts the spans read by duration)" },
        items: { type: 'array', description: 'stats: [{ label, unit?, goodWhen?: up|down, promql? | value? | values? }]' },
        label: { type: 'string', description: 'badge, link' },
        href: { type: 'string', description: 'link (default: the first Dash0 link the page read)' },
        tags: { type: 'array', description: 'tags: [{ label, value }]' },
        blocks: { type: 'array', description: 'row, column, card: the blocks inside' },
    },
}
export const SHOW_TOOL = {
    name: 'ditt0_show',
    description: [
        'Open a live page in a Claude Code pane, drawn with Dash0\'s design system (Ditt0), and kept current from the Dash0 MCP every 30 seconds.',
        'Use it when the person asks to see, show, chart, compare or watch numbers ("show me checkout\'s error rate and slowest spans"), in place of a markdown table or a code block, for data you already have too (a tool\'s answer, a file, numbers the person gave): pass it inline. Keep your reply to what the page does not say.',
        'Compose the page from blocks: heading, text, stats (a row of headline numbers), timeseries (a chart over time, with its own Dots/Lines/Bars and zoom controls), bars, pie (parts of one whole: shares by status, kind or service), gantt (tasks or spans over time), diagram (Mermaid: how things connect), table (inline rows, or spans: the newest spans from Dash0), badge, tags, link (Open in Dash0), and row/column/card for layout.',
        'For Dash0 data give a block promql (its time range and step come from the page range; write [$step] as the rate window) or query { tool, args }. Span metrics: {otel_metric_name="dash0.spans", service_name="checkout", otel_span_kind="SERVER"}; errors add otel_span_status_code="ERROR"; durations are {otel_metric_name="dash0.spans.duration"} histograms (histogram_quantile over sum by (le)).',
        'Data you already have goes inline (series and times, bars, rows). The same id again replaces the page. Check metric and label names with the Dash0 tools first when unsure.',
        'To show a Perses dashboard (a Dash0 dashboard\'s definition, or one from a file or percli), give perses: the dashboard as an object or its JSON or YAML text, in place of blocks, and variables to set its variables ({ instance: "node-1" }, or "$__all"); id and title then default to the dashboard\'s. Its PromQL panels draw live; the answer lists what could not draw.',
    ].join(' '),
    isDeferred: false,
    inputSchema: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'The page id, up to 53 letters, digits, _ or -; the same id replaces that page' },
            title: { type: 'string', description: 'One to three words, sentence case' },
            server: { type: 'string', description: 'The Dash0 MCP server to ask; default the one Claude last used' },
            dataset: { type: 'string', description: 'The Dash0 dataset every query asks (default default); a block may name its own' },
            range: { type: 'string', enum: RANGES.map(r => r.value), description: 'The time range the page opens on (default 1h)' },
            refreshMs: { type: 'number', description: 'How often to ask again (default 30000)' },
            blocks: { type: 'array', items: BLOCK_SCHEMA, description: 'Required, unless perses is given' },
            perses: { description: 'A Perses dashboard to draw in place of blocks: { kind: "Dashboard", metadata, spec: { panels, layouts, variables } }, or its JSON or YAML text' },
            variables: { type: 'object', description: 'With perses: what to set its variables to, { name: value or [values] }, "$__all" for all' },
        },
    },
}

// The full name the ditt0_show tool is listed and called by
export const SHOW_TOOL_NAME = 'mcp__ditt0-cli-design-system__ditt0_show'

// /ditt0-perses <file> [name=value …]: a Perses dashboard, a JSON or YAML file, as a live page. name=value sets a
// variable, name=a,b sets it to several values, name=* to all of them; server=<name> names the Dash0 MCP server
export const PERSES_COMMAND = { name: 'ditt0-perses', description: 'Open a Perses dashboard (JSON or YAML file) as a live page: /ditt0-perses <file> [variable=value …]' }
export const persesArgsOf = (args) => {
    const words = [...str(args).matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(m => m[1] ?? m[2] ?? m[3])
    const variables = {}
    let file = ''
    let server = ''
    for (const word of words) {
        const setting = word.match(/^([A-Za-z_]\w*)=(.*)$/)
        if (!setting) { file ||= word; continue }
        const [, name, value] = setting
        if (name === 'server') server = value
        else variables[name] = value === '*' ? '$__all' : value.includes(',') ? value.split(',').filter(Boolean) : value
    }
    return { file, variables, server }
}

// The $.ditt0 noun, and every hook behind it: the noun's methods are events (ditt0.open, ditt0.update, ditt0.close),
// each answered here with its own $; the panes they open draw with draw(page, handlers); the ditt0_show tool opens
// one for Claude. server(named): the MCP server a spec that names none asks. The tool itself is registered in the
// plugin's one session.start hook (hooks/register.jsx), from SHOW_TOOL
// What a method answers when its hook failed: nothing opened, updated or closed
const NOT_DONE = { open: { id: '', opened: false }, update: { id: '', updated: false }, close: { id: '', closed: false } }
export function registerSpecPages(on, { server, draw }) {
    on('engine.create', async ($, e, next) => {
        const built = await next(e)
        return {
            ...built,
            ditt0: {
                open: async () => NOT_DONE.open,
                update: async () => NOT_DONE.update,
                close: async () => NOT_DONE.close,
            },
        }
    })

    // $.ditt0.open(spec), from this plugin or one that depends on it: e is the spec
    on('ditt0.open', async ($, e) => ({ value: await openSpecPage($, e, server(e?.server)) }))
        .catch(($, e, next) => next(e))
    on('ditt0.update', async ($, e) => ({ value: await updateSpecPage($, e) }))
        .catch(($, e, next) => next(e))
    on('ditt0.close', async ($, e) => ({ value: await closeSpecPage($, e) }))
        .catch(($, e, next) => next(e))

    // /ditt0-perses <file>: the dashboard read from the file, opened as a page; what didn't draw is printed under it
    on('command.run', { command: PERSES_COMMAND.name }, async ($, e) => {
        const { file, variables, server: named } = persesArgsOf(e.args)
        if (!file) return { text: `Name a Perses dashboard file: /${PERSES_COMMAND.name} dashboards/checkout.yaml [variable=value …]` }
        let text
        try {
            text = await $.fs.read(file)
        } catch (err) {
            return { text: `Couldn't read ${file}: ${String(err?.message ?? err)}` }
        }
        return { text: showAnswer(await openSpecPage($, { perses: text, variables }, server(named))) }
    }).catch(() => ({ text: 'The Perses dashboard could not open.' }))

    // Claude composed a page: open it, and tell Claude what opened and what was left out
    on('tool.call', { tool: SHOW_TOOL_NAME }, async ($, e) => ({ result: showAnswer(await openSpecPage($, e, server(e?.server))) }))
        .catch(() => ({ result: 'The Ditt0 page could not open.' }))

    // A spec page's pane closed: it stops asking
    on('ui.close', async ($, e, next) => {
        closedSpecPage(e.id)
        return next(e)
    }).catch(($, e, next) => next(e))

    on('ui.render', { component: 'Pane' }, async ($, e, next) => {
        const page = specPageOfPane(e.requestId)
        if (!page) return next(e)
        setElements($.ui.resolve(e), e.surface)
        setRedraw(() => $.ui.invalidate('ui.render'))
        setCopy(copierOf($))
        // Its Close stops the page here too: a plugin's own $.ui.close may not pass back through its ui.close hook
        return draw(page, livePageHandlers($, page, () => { closedSpecPage(e.requestId); void $.ui.close({ id: e.requestId }) }))
    })
}
