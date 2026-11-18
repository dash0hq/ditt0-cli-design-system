// An example of a mod that draws with Ditt0 without importing it: it depends on ditt0-cli-design-system
// (plugin.json) and calls $.ditt0, whose contract that plugin ships (types/index.d.ts). /hello-ditt0 opens a page
// with a live Dash0 chart, which Ditt0 asks for every 30 seconds, beside a chart of this mod's own data, which the
// mod pushes every 3 seconds with $.ditt0.update. Only plain JSON goes across

const PAGE = 'hello-ditt0'
const PUSH_MS = 3_000
const POINTS = 20

// This mod's own numbers: a queue's depth, a walk that stays between 0 and 100
let depth = []
let timer = null
const nextDepth = (last) => Math.max(0, Math.min(100, Math.round(last + (Math.random() - 0.5) * 20)))
const pad = (n) => String(n).padStart(2, '0')
const clock = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }

// What the queue chart and stat show, as Ditt0 takes them
const queueData = () => ({
    queue: { series: [{ name: 'jobs', values: depth.map(p => p.value) }], times: depth.map(p => clock(p.at)) },
    'queue-now': { values: depth.map(p => p.value) },
})

// server: the Dash0 MCP server the command names; none, and Ditt0 picks the one Claude last used
const spec = (server) => ({
    id: PAGE,
    title: 'Hello Ditt0',
    ...(server ? { server } : {}),
    range: '15m',
    blocks: [
        { type: 'text', text: 'A Dash0 chart, asked by Ditt0, beside numbers this mod pushes itself', color: 'subtle' },
        { type: 'stats', items: [
            { id: 'rate-now', label: 'Span rate', unit: '/s', promql: 'sum(rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[$step]))' },
            { id: 'queue-now', label: 'Jobs in queue', values: depth.map(p => p.value) },
        ] },
        { type: 'row', blocks: [
            { type: 'timeseries', id: 'rate', title: 'Server spans', unit: '/s', promql: 'sum(rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[$step]))' },
            { type: 'timeseries', id: 'queue', title: 'Jobs in queue', subtitle: 'hello-ditt0, every 3 s', lineType: 'box', ...queueData().queue },
        ] },
        { type: 'link' },
    ],
})

function stop() {
    timer?.cancel()
    timer = null
}

// Adds a point and pushes the queue's data; stops once the page is gone (closed, or never drawn)
async function push($) {
    const now = await $.clock.now().catch(() => Date.now())
    depth = [...depth, { at: now, value: nextDepth(depth.at(-1)?.value ?? 40) }].slice(-POINTS)
    const result = await $.ditt0.update({ id: PAGE, data: queueData() })
    if (!result.updated) stop()
}

export function register(on) {
    on('session.start', async ($, e, next) => {
        await $.command.register({ name: 'hello-ditt0', description: 'Open an example Ditt0 page: a live Dash0 chart and data of its own; optionally name the Dash0 MCP server' })
        return next(e)
    })

    on('command.run', { command: 'hello-ditt0' }, async ($, e) => {
        stop()
        const now = await $.clock.now().catch(() => Date.now())
        depth = Array.from({ length: POINTS }, (_, i) => ({ at: now - (POINTS - 1 - i) * PUSH_MS, value: 40 }))
        for (let i = 1; i < POINTS; i++) depth[i].value = nextDepth(depth[i - 1].value)
        const opened = await $.ditt0.open(spec(e.args.trim()))
        if (opened.opened) timer = $.clock.every(PUSH_MS, () => { void push($) })
        return { text: `hello-ditt0: ${JSON.stringify(opened)}` }
    })
}
