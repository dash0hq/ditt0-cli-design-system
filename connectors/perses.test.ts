import { test, expect } from 'claude-code/testing'
import { persesPage, readPerses, variablesOf, interpolate, unitOfFormat, statusOfColor, msOf, rangeOfDuration, ALL } from './perses.js'
import { normalizeSpec, queriesOf, blocksOf, subsOf } from './spec-page.js'
import { NODE_EXPORTER, DASH0_STORED, UPSTREAM_EDGES, DASH0_YAML, DASH0_JSON_TEXT, bigDashboard } from '../fixtures/perses.js'

// Every block of a page, containers opened; and every PromQL query it asks
const allBlocks = (spec: any): any[] => blocksOf(spec.blocks)
const promqlOf = (spec: any): string[] => allBlocks(spec).flatMap((b: any) => subsOf(b).map((q: any) => q.promql))
const vars = (entries: Record<string, string[] | typeof ALL>) => new Map(Object.entries(entries).map(([k, v]) => [k, { values: v, shown: '' }]))

// Whether a query's quotes close and its brackets pair, as PromQL's lexer reads them
const balanced = (q: string) => {
    const stack: string[] = []
    let inString = false
    for (let i = 0; i < q.length; i++) {
        const c = q[i]
        if (inString) {
            if (c === '\\') { i++; continue }
            if (c === '"') inString = false
            if (c === '\n') return false
            continue
        }
        if (c === '"') { inString = true; continue }
        if ('({['.includes(c)) stack.push(c)
        else if (')}]'.includes(c) && stack.pop() !== '({['[')}]'.indexOf(c)]) return false
    }
    return !inString && stack.length === 0
}
// A PromQL string's value, its escapes undone
const unescape = (s: string) => s.replace(/\\(.)/g, (_, c) => ({ n: '\n', r: '\r', t: '\t' } as any)[c] ?? c)
// The one matcher of m{l <op> "..."}, as written
const matcherOf = (q: string) => {
    const m = q.match(/^m\{l(=~|!~|=|!=)"((?:[^"\\]|\\.)*)"\}$/)
    return m ? { op: m[1], value: unescape(m[2]) } : null
}
// A seeded random source, so a failing case runs again the same
const random = (seed: number) => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

// ── Reading ──────────────────────────────────────────────────────────────────────────────────────────────────────────

test('a dashboard is read from an object, JSON or YAML text, bare or as Dash0 wraps it', () => {
    expect(readPerses(NODE_EXPORTER).dashboard).toBe(NODE_EXPORTER)
    expect(readPerses(DASH0_STORED).dashboard).toBe(DASH0_STORED.dashboard)
    expect(readPerses({ persesDefinition: NODE_EXPORTER }).dashboard).toBe(NODE_EXPORTER)
    expect(readPerses(DASH0_JSON_TEXT).dashboard).toEqual(NODE_EXPORTER)
    expect((readPerses(DASH0_YAML).dashboard as any).spec.display.name).toBe('Spans by service')
    expect(readPerses(`  \n${DASH0_JSON_TEXT}\n `).problems).toEqual([])
})

test('what is not a dashboard is refused, and says why', () => {
    for (const input of [null, undefined, 42, [], {}, { kind: 'Dashboard' }, { spec: [] }, { dashboard: 'x' }, 'kind: Dashboard\nmetadata: {}'])
        expect(readPerses(input as any)).toEqual({ dashboard: null, problems: ['A Perses dashboard is an object with a spec: { kind: "Dashboard", metadata, spec: { panels, layouts } }'] })
    expect(readPerses('')).toEqual({ dashboard: null, problems: ['The Perses dashboard is empty'] })
    expect(readPerses('{ "spec": ').problems[0]).toMatch(/^The Perses dashboard is not JSON or YAML: /)
    expect(readPerses('a: [1, 2\nb: }').problems[0]).toMatch(/^The Perses dashboard is not JSON or YAML: /)
    // Another kind is read as a dashboard all the same, and named
    expect(readPerses({ kind: 'Folder', spec: {} }).problems).toEqual(['kind "Folder" is not a Perses Dashboard; read as one'])
})

test('a duration is read in ms, and opens on the shortest range that holds it', () => {
    expect(msOf('30s')).toBe(30_000)
    expect(msOf('1h30m')).toBe(5_400_000)
    expect(msOf('500ms')).toBe(500)
    expect(msOf('2w')).toBe(1_209_600_000)
    for (const bad of ['', '5', '5x', 'h1', '1h 30m', undefined, null, 5]) expect(msOf(bad as any)).toBeNull()
    const ranges = Object.fromEntries(['5m', '15m', '16m', '30m', '1h', '3h', '6h', '12h', '24h', '7d', 'nope'].map(d => [d, rangeOfDuration(d)]))
    expect(ranges).toEqual({ '5m': '15m', '15m': '15m', '16m': '1h', '30m': '1h', '1h': '1h', '3h': '6h', '6h': '6h', '12h': '24h', '24h': '24h', '7d': '24h', nope: '1h' })
})

// ── Variables ────────────────────────────────────────────────────────────────────────────────────────────────────────

test('each variable is set to what it was given, else its default, else its first static value, else all', () => {
    const { vars: set, problems } = variablesOf(UPSTREAM_EDGES as any)
    expect([...set].map(([name, v]) => [name, v.values, v.shown])).toEqual([
        ['env', ['prod'], 'prod'],
        ['job', ['api'], 'api'],
        ['pod', ALL, 'All'],
        ['ds', ALL, 'All'],
    ])
    expect(problems).toEqual(['variable ds: DatasourceVariable is not one this page reads; it matches everything'])
    // A Dash0 filter variable belongs to Dash0's structured queries: not listed
    expect([...variablesOf((DASH0_STORED as any).dashboard).vars.keys()]).toEqual(['service', 'kind'])
    expect(variablesOf((DASH0_STORED as any).dashboard).vars.get('service')!.values).toEqual(['checkout', 'frontend'])
    expect(variablesOf((DASH0_STORED as any).dashboard).vars.get('kind')!.values).toEqual(['SERVER'])
})

test('what is given wins: one value, several, all, and a name the dashboard lacks is named', () => {
    const dashboard = UPSTREAM_EDGES as any
    const given = variablesOf(dashboard, { env: 'stage', job: ['a', 'b'], pod: '*', nope: 'x' })
    expect(given.vars.get('env')).toEqual({ values: ['stage'], shown: 'stage' })
    expect(given.vars.get('job')).toEqual({ values: ['a', 'b'], shown: 'a, b' })
    expect(given.vars.get('pod')).toEqual({ values: ALL, shown: 'All' })
    expect(given.problems).toContain('variable nope: the dashboard has no such variable')
    // Nothing given, or only empty values, is all
    expect(variablesOf(dashboard, { env: [] }).vars.get('env')!.values).toBe(ALL)
    expect(variablesOf(dashboard, { env: '$__all' }).vars.get('env')!.values).toBe(ALL)
    const empty = { spec: { variables: [{ kind: 'ListVariable', spec: { name: 'x', defaultValue: [] } }, { kind: 'ListVariable', spec: { name: 'y', defaultValue: '$__all' } }, { kind: 'ListVariable', spec: {} }, null, 'x'] } }
    expect([...variablesOf(empty as any).vars].map(([n, v]) => [n, v.values])).toEqual([['x', ALL], ['y', ALL]])
})

// ── Interpolation ────────────────────────────────────────────────────────────────────────────────────────────────────

test('in a label matcher, one value goes in as written; several or all turn = into a regex matcher', () => {
    const one = vars({ v: ['x'] })
    const many = vars({ v: ['x', 'y'] })
    const all = vars({ v: ALL })
    expect(interpolate('up{a="$v"}', one).query).toBe('up{a="x"}')
    expect(interpolate('up{a="$v"}', many).query).toBe('up{a=~"^(x|y)$"}')
    expect(interpolate('up{a="$v"}', all).query).toBe('up{a=~"^.*$"}')
    expect(interpolate('up{a!="$v"}', many).query).toBe('up{a!~"^(x|y)$"}')
    expect(interpolate('up{a!="$v"}', all).query).toBe('up{a!~"^.*$"}')
    expect(interpolate('up{a=~"$v"}', many).query).toBe('up{a=~"^(x|y)$"}')
    expect(interpolate('up{a=~"$v"}', all).query).toBe('up{a=~"^.*$"}')
    // Around a reference: kept as written, or matched exactly once the matcher turns regex
    expect(interpolate('up{a="api-$v"}', one).query).toBe('up{a="api-x"}')
    expect(interpolate('up{a="$v.local"}', many).query).toBe('up{a=~"^((x|y)\\\\.local)$"}')
    expect(interpolate('up{a=~"^$v.*"}', many).query).toBe('up{a=~"^(^(x|y).*)$"}')
    // Spaces around the operator, a UTF-8 quoted label name, two matchers, and $ that isn't a variable
    expect(interpolate('up{ a = "$v" , b=~"z$"}', many).query).toBe('up{ a =~ "^(x|y)$" , b=~"z$"}')
    expect(interpolate('{"service.name"="$v"}', one).query).toBe('{"service.name"="x"}')
    expect(interpolate('label_replace(up{a="$v"}, "dst", "$1", "src", "(.*)")', one).query).toBe('label_replace(up{a="x"}, "dst", "$1", "src", "(.*)")')
})

test('a value is escaped for a PromQL string, and for a regex wherever the matcher is one', () => {
    expect(interpolate('up{a="$v"}', vars({ v: ['say "hi" \\ there'] })).query).toBe('up{a="say \\"hi\\" \\\\ there"}')
    expect(interpolate('up{a=~"$v"}', vars({ v: ['a.b'] })).query).toBe('up{a=~"^a\\\\.b$"}')
    expect(interpolate('up{a="$v"}', vars({ v: ['a.b', 'c|d'] })).query).toBe('up{a=~"^(a\\\\.b|c\\\\|d)$"}')
    expect(interpolate('up{a="$v"}', vars({ v: ['line\nbreak'] })).query).toBe('up{a="line\\nbreak"}')
})

test('${name}, ${name:format} and [[name]] work as Perses and Grafana write them', () => {
    const many = vars({ v: ['a.b', 'c'] })
    expect(interpolate('up{a=~"${v:regex}"}', many).query).toBe('up{a=~"^(a\\\\.b|c)$"}')
    expect(interpolate('up{a=~"${v:pipe}"}', many).query).toBe('up{a=~"^(a.b|c)$"}')
    expect(interpolate('up{a="${v:csv}"}', many).query).toBe('up{a="a.b,c"}')
    expect(interpolate('up{a="${v:singlevariablevalue}"}', many).query).toBe('up{a="a.b"}')
    expect(interpolate('up{a="${v}"}', vars({ v: ['x'] })).query).toBe('up{a="x"}')
    expect(interpolate('up{a="[[v]]"}', vars({ v: ['x'] })).query).toBe('up{a="x"}')
    expect(interpolate('count(up) by (${v:csv})', many).query).toBe('count(up) by (a.b,c)')
    expect(interpolate('x{a="1"} == ${v:json}', many).query).toBe('x{a="1"} == ["a.b","c"]')
})

test('outside a matcher a value goes in as written: a window, a by, a topk', () => {
    const set = vars({ window: ['10m'], n: ['5'], by: ['pod', 'node'] })
    expect(interpolate('topk($n, sum by ($by) (rate(x[$window])))', set).query).toBe('topk(5, sum by (pod,node) (rate(x[10m])))')
    // A name that starts like another's is its own
    expect(interpolate('up{a="$environment", b="$env"}', vars({ env: ['e'], environment: ['long'] })).query).toBe('up{a="long", b="e"}')
})

test("the page's built-ins stay for it to put in, and a variable no one sets is named", () => {
    const q = 'rate(x[$__rate_interval]) * ${__range_s} / $__interval_ms + increase(y[$__range])'
    expect(interpolate(q, vars({}))).toEqual({ query: q, unknown: [] })
    // Unknown in a matcher: it matches everything; elsewhere: it stays, so the query fails rather than lies
    expect(interpolate('up{a="$nope"}', vars({}))).toEqual({ query: 'up{a=~"^.*$"}', unknown: ['nope'] })
    expect(interpolate('rate(x[$nope])', vars({}))).toEqual({ query: 'rate(x[$nope])', unknown: ['nope'] })
    // Set to all, outside a matcher, it can't be written: it stays and is named
    expect(interpolate('topk($n, up)', vars({ n: ALL }))).toEqual({ query: 'topk($n, up)', unknown: ['n'] })
})

test('any value in any matcher gives a PromQL string that matches it, and in a regex matches nothing else', () => {
    const next = random(7)
    const POOL = 'ab.*+?^$(){}[]|\\"-_ /:\n\té'
    const word = () => Array.from({ length: 1 + Math.floor(next() * 6) }, () => POOL[Math.floor(next() * POOL.length)]).join('')
    for (let i = 0; i < 500; i++) {
        const values = Array.from({ length: 1 + Math.floor(next() * 3) }, word)
        const op = ['=', '!=', '=~', '!~'][Math.floor(next() * 4)]
        const out = interpolate(`m{l${op}"$v"}`, vars({ v: values })).query
        expect(balanced(out)).toBe(true)
        const m = matcherOf(out)!
        expect(m).not.toBeNull()
        if (m.op === '=' || m.op === '!=') {
            expect(values.length).toBe(1)
            expect(m.value).toBe(values[0])
            continue
        }
        // Prometheus anchors a matcher's regex at both ends
        const re = new RegExp(`^(?:${m.value})$`, 's')
        for (const v of values) expect(re.test(v)).toBe(true)
        const other = word() + '#'
        expect(re.test(other)).toBe(false)
    }
})

// ── Units and colours ────────────────────────────────────────────────────────────────────────────────────────────────

test("a format's unit becomes Ditt0's, a time in ns, μs, minutes or hours converted into seconds", () => {
    const table = Object.fromEntries(['percent', '%', 'percent-decimal', 'decimal', 'short', '', 'seconds', 'milliseconds', 'nanoseconds', 'microsecond', 'minutes', 'hours', 'days', 'bytes', 'decbytes', 'bytes/sec', 'bytes/s', 'bits/sec', 'requests/sec', 'ops/sec', '/s', 'currency-eur', 'celsius', 'fahrenheit', 'widgets'].map(u => [u, unitOfFormat({ unit: u })]))
    expect(table).toEqual({
        percent: { unit: 'percent' }, '%': { unit: 'percent' }, 'percent-decimal': { unit: 'ratio' },
        decimal: { unit: '' }, short: { unit: '' }, '': { unit: '' },
        seconds: { unit: 'seconds' }, milliseconds: { unit: 'milliseconds' },
        nanoseconds: { unit: 'seconds', convert: '/ 1000000000' }, microsecond: { unit: 'seconds', convert: '/ 1000000' },
        minutes: { unit: 'seconds', convert: '* 60' }, hours: { unit: 'seconds', convert: '* 3600' }, days: { unit: 'seconds', convert: '* 86400' },
        bytes: { unit: 'bytes' }, decbytes: { unit: 'bytes' }, 'bytes/sec': { unit: 'bytes/s' }, 'bytes/s': { unit: 'bytes/s' }, 'bits/sec': { unit: 'bits/s' },
        'requests/sec': { unit: 'requests/s' }, 'ops/sec': { unit: 'ops/s' }, '/s': { unit: '/s' },
        'currency-eur': { unit: 'EUR' }, celsius: { unit: '°C' }, fahrenheit: { unit: '°F' }, widgets: { unit: 'widgets' },
    })
    expect(unitOfFormat(undefined)).toEqual({ unit: '' })
    expect(unitOfFormat('bytes')).toEqual({ unit: 'bytes' })
})

test("a threshold's colour becomes a status by its name or hue, else by its place", () => {
    const of = (c: string, i = 0, n = 2) => statusOfColor(c, i, n)
    expect(['green', 'Green', 'dark-green', 'orange', 'yellow', 'red', 'semi-dark-red', 'blue', 'purple', 'grey'].map(c => of(c))).toEqual(['healthy', 'healthy', 'healthy', 'warning', 'warning', 'error', 'error', 'info', 'info', 'unknown'])
    expect(['#0a0', '#00ff00', '#f5a623', '#e0245e', '#ff0000', '#1f77b4', '#999999', 'rgb(255, 152, 48)', 'rgba(242, 73, 92, 0.5)'].map(c => of(c))).toEqual(['healthy', 'healthy', 'warning', 'error', 'error', 'info', 'unknown', 'warning', 'error'])
    // No name, no hue: the last step is the worst
    expect([of('var(--x)', 0, 3), of('', 1, 3), of('nope', 2, 3)]).toEqual(['warning', 'warning', 'error'])
})

// ── Whole dashboards ─────────────────────────────────────────────────────────────────────────────────────────────────

test('Perses\' node dashboard: four titled sections, every panel in its place, every variable put in', () => {
    const { spec, problems } = persesPage(NODE_EXPORTER)
    expect(problems).toEqual([])
    expect(spec).toMatchObject({ id: 'perses-node-exporter-nodes', title: 'Node Exporter / Nodes', range: '1h', refreshMs: 30_000 })
    expect(spec!.blocks[0]).toEqual({ type: 'tags', id: 'variables', tags: [{ label: 'instance', value: 'All' }] })
    expect(spec!.blocks.filter((b: any) => b.type === 'heading').map((b: any) => b.text)).toEqual(['CPU', 'Memory', 'Disk', 'Network'])
    // Each section a row of its two panels, left to right
    expect(spec!.blocks.filter((b: any) => b.type === 'row').map((r: any) => r.blocks.map((b: any) => b.id))).toEqual([
        ['p-cpu', 'p-load'], ['p-memory', 'p-memoryGauge'], ['p-disk', 'p-uptime-stats'], ['p-network', 'p-errors'],
    ])
    const byId = Object.fromEntries(allBlocks(spec).filter((b: any) => b.id).map((b: any) => [b.id, b]))
    expect(byId['p-cpu']).toMatchObject({ type: 'timeseries', title: 'CPU usage', unit: 'ratio' })
    expect(byId['p-load'].queries.map((q: any) => q.name)).toEqual(['1m', '5m', '15m'])
    expect(byId['p-memory']).toMatchObject({ unit: 'bytes', stacked: true })
    expect(byId['p-memoryGauge']).toMatchObject({ type: 'gauge', unit: 'percent', calculation: 'last', thresholds: [{ value: 80, color: 'warning' }, { value: 90, color: 'error' }] })
    expect(byId['p-disk']).toMatchObject({ unit: 'bytes/s' })
    expect(byId['p-disk'].queries.map((q: any) => q.name)).toEqual(['{{device}} read', '{{device}} written'])
    expect(byId['p-uptime']).toMatchObject({ label: 'Uptime', unit: 'seconds', calculation: 'last-number' })
    expect(byId['p-network']).toMatchObject({ lineType: 'bars' })
    // 13 queries; instance is All, so each of its matchers matches anything
    const queries = promqlOf(spec)
    expect(queries).toHaveLength(13)
    expect(queries.every(q => !q.includes('$instance') && q.includes('instance=~"^.*$"'))).toBe(true)
    expect(queries[0]).toBe('1 - sum without (mode) (rate(node_cpu_seconds_total{instance=~"^.*$",job="node",mode=~"idle|iowait|steal"}[$__rate_interval]))')
})

test('the node dashboard for one instance, and for two', () => {
    const one = promqlOf(persesPage(NODE_EXPORTER, { variables: { instance: 'node-1:9100' } }).spec)
    expect(one.every(q => q.includes('instance="node-1:9100"'))).toBe(true)
    const two = persesPage(NODE_EXPORTER, { variables: { instance: ['node-1:9100', 'node-2:9100'] } }).spec!
    expect(promqlOf(two).every(q => q.includes('instance=~"^(node-1:9100|node-2:9100)$"'))).toBe(true)
    expect(two.blocks[0].tags).toEqual([{ label: 'instance', value: 'node-1:9100, node-2:9100' }])
})

test('a dashboard as Dash0 stores it: its variables, Markdown, stats side by side, and the two panels that stay in Dash0', () => {
    const { spec, problems } = persesPage(DASH0_STORED)
    expect(problems).toEqual([
        "panel Slowest spans: SpanTable panels don't draw here",
        'panel Throughput by operation: SpansTimeSeriesQuery is not PromQL; not drawn',
    ])
    expect(spec).toMatchObject({ id: 'perses-checkout-health', title: 'Checkout health', range: '6h' })
    expect(spec!.refreshMs).toBeUndefined()
    expect(spec!.blocks.map((b: any) => b.type)).toEqual(['tags', 'heading', 'markdown', 'stats', 'timeseries', 'heading', 'row', 'row'])
    expect(spec!.blocks[0].tags).toEqual([{ label: 'service', value: 'checkout, frontend' }, { label: 'kind', value: 'SERVER' }])
    // A Markdown panel with no name has no title
    expect(spec!.blocks[2]).toEqual({ type: 'markdown', id: 'p-about', text: '## Checkout\n\nRequests, errors and latency for **checkout** and the services it calls. Owned by the payments team.' })
    // Two stats in one row are one row of headline numbers
    expect(spec!.blocks[3].items.map((i: any) => [i.id, i.unit, i.calculation])).toEqual([['p-errorRate', 'percent', 'mean'], ['p-p95', 'seconds', 'last']])
    expect(spec!.blocks[3].items[0].thresholds).toEqual([{ value: 1, color: 'warning' }, { value: 5, color: 'error' }])
    expect(spec!.blocks[4]).toMatchObject({ id: 'p-requests', unit: 'requests/s', queries: [{ promql: 'sum by (service_name) (rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER", service_name=~"^(checkout|frontend)$"}[$__rate_interval]))', name: '{{service_name}}' }] })
    // The collapsed section still draws; the panels a terminal can't draw are cards naming why
    expect(spec!.blocks[5]).toEqual({ type: 'heading', text: 'Breakdown', level: 'h3' })
    expect(spec!.blocks[6].blocks.map((b: any) => [b.type, b.id, b.calculation])).toEqual([['pie', 'p-byStatus', 'sum'], ['table', 'p-topServices', 'mean']])
    expect(spec!.blocks[7].blocks).toEqual([
        { type: 'card', id: 'p-slowSpans', title: 'Slowest spans', blocks: [{ type: 'text', color: 'subtle', text: "SpanTable panels don't draw in the terminal." }] },
        { type: 'card', id: 'p-throughput', title: 'Throughput by operation', blocks: [{ type: 'text', color: 'subtle', text: "Its SpansTimeSeriesQuery doesn't run in the terminal." }] },
    ])
})

test('every edge a dashboard has is drawn or named, never dropped', () => {
    const { spec, problems } = persesPage(UPSTREAM_EDGES)
    expect(problems).toEqual([
        'variable ds: DatasourceVariable is not one this page reads; it matches everything',
        "panel Queue age: its thresholds are percentages of a max it doesn't give; left out",
        'panel Latency: its log scale draws linear',
        'panel Latency: stacked to 100% upstream, stacked by value here',
        'layout 0: #/spec/panels/ghost names no panel',
        "panel Latency heatmap: HeatMapChart panels don't draw here",
        "panel Logs: LogsTable panels don't draw here",
        'layout 2: Tabs is not a Grid; its panels go at the end',
        '1 panel is in no layout; drawn at the end',
        '$undefinedVar: no value is set, so it matches everything in a label matcher and stays as written elsewhere',
    ])
    expect(spec).toMatchObject({ id: 'perses-edge-cases-upstream', title: 'Edge cases', range: '1h' })
    const byId = Object.fromEntries(allBlocks(spec).filter((b: any) => b.id).map((b: any) => [b.id, b]))
    // A panel placed twice draws twice; a key with a slash in it is found through its escaped pointer
    expect(Object.keys(byId).filter(id => id.startsWith('p-latency'))).toEqual(['p-latency', 'p-latency-2'])
    expect(byId['p-a-b'].queries).toEqual([{ promql: 'up{env=~"^.*$"}' }])
    // The hidden query is left out; ns convert to seconds; ${env:regex} and [[job]] put in
    expect(byId['p-latency'].queries).toEqual([{ promql: '(histogram_quantile(0.99, sum by (le) (rate(http_request_duration_ns_bucket{env=~"^prod$", job="api"}[$__rate_interval])))) / 1000000000', name: 'p99' }])
    expect(byId['p-queueAge']).toEqual({ id: 'p-queueAge', label: 'Queue age', queries: [{ promql: '(max(queue_age_minutes{env=~"^prod$"})) * 60' }], calculation: 'max', unit: 'seconds' })
    expect(byId['p-spend']).toMatchObject({ type: 'gauge', unit: 'USD', max: 1000, calculation: 'sum', thresholds: [{ value: 750, color: 'warning' }, { value: 900, color: 'error' }] })
    expect(byId['p-temp']).toMatchObject({ type: 'gauge', unit: '°C' })
    expect(byId['p-temp'].max).toBeUndefined()
    expect(byId['p-share']).toMatchObject({ type: 'pie', queries: [{ promql: 'sum by (code) (rate(http_requests_total{job="api", pod=~"^.*$"}[5m]))', name: 'HTTP {{code}}' }] })
    expect(byId['p-top']).toMatchObject({ type: 'bars', orientation: 'horizontal', calculation: 'mean', unit: 'requests/s' })
    expect(byId['p-table']).toMatchObject({ type: 'table', calculation: 'last' })
    expect(byId['p-bare']).toMatchObject({ type: 'timeseries', title: 'No plugin', queries: [{ promql: 'up{job="api"}' }] })
    expect(byId['p-empty'].blocks[0].text).toBe('This panel has no query.')
    expect(byId['p-heat'].type).toBe('card')
    expect(byId['p-ingest'].queries[0].promql).toBe('sum(ingest_lag_ms) / $__interval_ms * $__range_s')
    // The panel no layout places is last
    expect(spec!.blocks[spec!.blocks.length - 1]).toEqual({ type: 'markdown', id: 'p-loose', title: 'Not placed', text: 'Placed by no layout.' })
})

test('a YAML dashboard with no layout draws its panels in order; a multi-select set to all matches everything', () => {
    const { spec, problems } = persesPage(DASH0_YAML)
    expect(problems).toEqual([])
    expect(spec).toMatchObject({ id: 'perses-spans-by-service', title: 'Spans by service', range: '15m' })
    expect(spec!.blocks.map((b: any) => b.id)).toEqual(['variables', 'p-throughput', 'p-errors'])
    expect(promqlOf(spec)).toEqual([
        'sum by (service_name) (rate({otel_metric_name="dash0.spans", service_name=~"^.*$"}[$__rate_interval]))',
        'sum(rate({otel_metric_name="dash0.spans", otel_span_status_code="ERROR", service_name=~"^.*$"}[$__rate_interval]))',
    ])
})

test('a dashboard and its JSON text are the same page', () => {
    expect(persesPage(DASH0_JSON_TEXT)).toEqual(persesPage(NODE_EXPORTER))
})

test('what is given beside a dashboard wins: id, title, range, refresh, server, dataset, an Open in Dash0 link', () => {
    const { spec } = persesPage(NODE_EXPORTER, { id: 'nodes', title: 'Nodes', range: '24h', refreshMs: 60_000, server: 'dash0-prod', dataset: 'staging', href: 'https://app.dash0.com/dashboards/abc' })
    expect(spec).toMatchObject({ id: 'nodes', title: 'Nodes', range: '24h', refreshMs: 60_000, server: 'dash0-prod', dataset: 'staging' })
    expect(spec!.blocks[1]).toEqual({ type: 'link', href: 'https://app.dash0.com/dashboards/abc' })
    // An id that isn't one, a range that isn't one, or a link that isn't one, is the dashboard's own
    const loose = persesPage(NODE_EXPORTER, { id: 'no spaces allowed', range: '2h', href: 'javascript:alert(1)' }).spec!
    expect([loose.id, loose.range, loose.blocks.some((b: any) => b.type === 'link')]).toEqual(['perses-node-exporter-nodes', '1h', false])
})

test('an empty dashboard is a page that says so', () => {
    const { spec, problems } = persesPage({ kind: 'Dashboard', metadata: { name: '' }, spec: {} })
    expect(problems).toEqual([])
    expect(spec).toEqual({ id: 'perses-dashboard', title: 'Dashboard', range: '1h', blocks: [{ type: 'text', color: 'subtle', text: 'This dashboard has no panels.' }] })
})

// ── Every page, checked whole ────────────────────────────────────────────────────────────────────────────────────────

const PAGES: [string, any, any][] = [
    ['node exporter', NODE_EXPORTER, {}],
    ['node exporter, one instance', NODE_EXPORTER, { variables: { instance: 'a"b' } }],
    ['node exporter, two instances', NODE_EXPORTER, { variables: { instance: ['x.y', 'z|w'] } }],
    ['Dash0 stored', DASH0_STORED, {}],
    ['Dash0 stored, all services', DASH0_STORED, { variables: { service: '$__all' } }],
    ['edge cases', UPSTREAM_EDGES, {}],
    ['edge cases, all envs', UPSTREAM_EDGES, { variables: { env: '*', job: ['a', 'b'] } }],
    ['YAML', DASH0_YAML, {}],
    ['YAML, one service', DASH0_YAML, { variables: { service: 'checkout' } }],
    ['big', bigDashboard(), {}],
]

for (const [name, dashboard, options] of PAGES) {
    test(`the ${name} page: a spec that opens as it is, ids unique, every query whole and its variables put in`, () => {
        const { spec } = persesPage(dashboard, options)
        // Only JSON, and the spec page takes it without a word
        expect(JSON.parse(JSON.stringify(spec))).toEqual(spec)
        const normal = normalizeSpec({ perses: dashboard, ...options })
        expect(normal.spec).not.toBeNull()
        expect(normal.problems.filter(p => !p.startsWith('perses: '))).toEqual([])
        const ids = allBlocks(spec).map((b: any) => b.id).filter(Boolean)
        expect(new Set(ids).size).toBe(ids.length)
        // Every query's quotes close and brackets pair, and names no variable but the page's built-ins
        const queries = Object.values(queriesOf(normal.spec!)('1h', Date.parse('2026-10-23T08:00:00Z'))) as any[]
        for (const q of queries) {
            expect(balanced(q.args.query)).toBe(true)
            expect(q.args.query).not.toMatch(/\$(__rate_interval|__interval|__range|step)\b/)
            expect(q.args.query.replace(/"(?:[^"\\]|\\.)*"/g, '""')).not.toMatch(/\$(?!undefinedVar|n\b)[A-Za-z_]/)
        }
    })
}

test('a dashboard of 120 panels and 240 queries converts in a moment, every panel in its place', () => {
    const big = bigDashboard()
    const started = performance.now()
    const { spec, problems } = persesPage(big)
    expect(performance.now() - started).toBeLessThan(200)
    expect(problems).toEqual([])
    expect(allBlocks(spec).filter((b: any) => /^p-g\d+_p\d+$/.test(b.id))).toHaveLength(120)
    expect(promqlOf(spec)).toHaveLength(240)
    expect(spec!.blocks.filter((b: any) => b.type === 'heading')).toHaveLength(30)
})

// ── Fuzz: any damage to a dashboard is read, never thrown ───────────────────────────────────────────────────────────

// A copy of a value with one place in it damaged: set to something of the wrong kind, or removed
const DAMAGE = [null, undefined, 0, -1, '', 'x', '$__all', true, [], {}, [null], { kind: 'Weird' }, { $ref: '#/spec/panels/nope' }]
const damage = (value: any, next: () => number): any => {
    const copy = JSON.parse(JSON.stringify(value))
    const places: [any, string][] = []
    const walk = (v: any) => {
        if (v && typeof v === 'object') for (const k of Object.keys(v)) { places.push([v, k]); walk(v[k]) }
    }
    walk(copy)
    for (let n = 1 + Math.floor(next() * 3); n > 0 && places.length; n--) {
        const [parent, key] = places[Math.floor(next() * places.length)]
        const bad = DAMAGE[Math.floor(next() * DAMAGE.length)]
        if (bad === undefined) delete parent[key]
        else parent[key] = bad
    }
    return copy
}

test('2000 damaged dashboards: each is a page or a reason, never a throw', () => {
    const next = random(42)
    const sources = [NODE_EXPORTER, DASH0_STORED, UPSTREAM_EDGES, JSON.parse(JSON.stringify(readPerses(DASH0_YAML).dashboard))]
    let pages = 0
    for (let i = 0; i < 2000; i++) {
        const input = damage(sources[i % sources.length], next)
        const { spec, problems } = persesPage(input, i % 5 === 0 ? { variables: { instance: ['a', 'b'], env: '*', service: 'x' } } : {})
        expect(Array.isArray(problems)).toBe(true)
        if (!spec) { expect(problems.length).toBeGreaterThan(0); continue }
        pages++
        const normal = normalizeSpec({ perses: input })
        expect(normal.spec).not.toBeNull()
        for (const q of Object.values(queriesOf(normal.spec!)('1h', 0)) as any[]) expect(typeof q.args.query).toBe('string')
    }
    expect(pages).toBeGreaterThan(1500)
})
