import { test, expect, mock } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'
import { normalizeSpec, queriesOf, withStep, emptyPromql, SPEC_PARSERS, SHOW_TOOL_NAME, PERSES_COMMAND, persesArgsOf } from '../../../connectors/spec-page.js'
import { readOf, reduceValues } from './spec-page.jsx'
import { parsePromql } from '../../../connectors/dash0/promql.js'
import { formatValue } from '../../foundations/units/units.js'
import { OVERVIEW_ERRORS, OVERVIEW_BY_SERVICE } from '../../../fixtures/dash0-overview.js'
import { NODE_EXPORTER, DASH0_STORED, DASH0_YAML, PERSES_BY_STATUS, PERSES_ALL_GAPS, PERSES_NO_RESULTS } from '../../../fixtures/perses.js'

const STORY = 'features-ditt0-pages-spec-page'
const PANE = { plugin: 'ditt0-cli-design-system', surface: 'terminal', component: 'Pane', props: { isFocused: true } }
const mean = (values: (number | null)[]) => { const n = values.filter((v): v is number => v !== null); return n.reduce((a, b) => a + b, 0) / n.length }

// A promql answer in the Dash0 MCP's shape, for values a test picks: one series per name, its labels as attributes
const answerOf = (series: { labels?: Record<string, string>; values: (number | null)[] }[], from = '2026-10-23T07:00:00.000Z') => {
    const keys = [...new Set(series.flatMap(s => Object.keys(s.labels ?? {})))]
    const head = `| Series ID |${keys.map(k => ` ${k} |`).join('')}\n| :-- |${keys.map(() => ' :-- |').join('')}`
    const rows = series.map((s, i) => `| #${i + 1} |${keys.map(k => ` ${s.labels?.[k] ?? ''} |`).join('')}`).join('\n')
    const times = series[0].values.map((_, i) => new Date(Date.parse(from) + i * 300_000).toISOString())
    const values = times.map((t, i) => `| ${t} |${series.map(s => ` ${s.values[i] ?? ''} |`).join('')}`).join('\n')
    return `# Series Attribute Sets\n${head}\n${rows}\n\n# Query Results per Series ID\n| Timestamp |${series.map((_, i) => ` #${i + 1} |`).join('')}\n| :-- |${series.map(() => ' :-- |').join('')}\n${values}\n`
}
const reply = (text: string) => ({ value: { content: [{ type: 'text', text }], isError: false } })

// ── The parts ────────────────────────────────────────────────────────────────────────────────────────────────────────

test("a block's queries each ask under their own key; the range's built-ins are put in at each ask", () => {
    const { spec } = normalizeSpec({ id: 'q', title: 'Q', blocks: [{ type: 'timeseries', id: 'load', queries: [{ promql: 'a[$__rate_interval]' }, { promql: '  ' }, { promql: 'b * ${__range_s} / $__interval_ms', name: 'b' }, 'nope'] }] })
    const queries = queriesOf(spec!)('6h', Date.parse('2026-10-23T08:00:00Z')) as any
    expect(Object.keys(queries)).toEqual(['load~0', 'load~1'])
    expect(queries['load~0'].args).toMatchObject({ query: 'a[30m]', timeSeriesOptions: { resolution: '30m' } })
    expect(queries['load~1'].args.query).toBe('b * 21600 / 1800000')
    expect(withStep('x[$__range] y[${__rate_interval}] z[$step] $__range_ms $__interval', '15m')).toBe('x[15m] y[1m] z[1m] 900000 1m')
    expect(withStep('x[$__range]', '24h')).toBe('x[24h]')
})

test("a block's answers draw together, each series named by its query's template", () => {
    const block = { key: 'k', queries: [{ promql: 'a', name: '{{service_name}} in' }, { promql: 'b', name: '{{ missing }}' }, { promql: 'c' }] }
    const byService = parsePromql(OVERVIEW_BY_SERVICE)!
    const one = parsePromql(OVERVIEW_ERRORS)!
    expect(readOf(block, {})).toBeNull()
    // One answered: drawn while the others wait
    expect(readOf(block, { 'k~1': one })!.series.map((s: any) => s.name)).toEqual(['#1'])
    const read = readOf(block, { 'k~0': byService, 'k~1': one, 'k~2': one })!
    expect(read.series.map((s: any) => s.name)).toEqual([...byService.series.map((s: any) => `${s.attributes.service_name} in`), '#1', '#1'])
    expect(read.times).toEqual(byService.times)
    expect(read.link).toBe(byService.link)
    // A block with its own promql reads its own key, queries or not
    expect(readOf({ key: 'k', promql: 'x', queries: block.queries }, { k: one, 'k~0': byService })).toBe(one)
})

test('a series becomes one value by each of Perses\' calculations, gaps where they fall', () => {
    const values = [null, 4, 1, null, 7, null]
    const all = Object.fromEntries(['last', 'first', 'last-number', 'first-number', 'mean', 'sum', 'min', 'max', undefined].map(c => [String(c), reduceValues(values, c)]))
    expect(all).toEqual({ last: null, first: null, 'last-number': 7, 'first-number': 4, mean: 4, sum: 12, min: 1, max: 7, undefined: 7 })
    for (const c of ['last', 'mean', 'sum', 'min', 'max', 'last-number']) expect(reduceValues([], c)).toBeNull()
    expect(reduceValues([null, null], 'mean')).toBeNull()
    expect(reduceValues(['3', NaN, Infinity, 2] as any, 'sum')).toBe(2)
})

test("an answer of no series reads as no data, not as a failed query; one of blank samples keeps its series", () => {
    expect(parsePromql(PERSES_NO_RESULTS)).toBeNull()
    expect(emptyPromql(PERSES_NO_RESULTS)).toEqual({ series: [], times: [], link: 'https://app.dash0.com/goto/metrics/query-builder?org=acme&dataset=default' })
    expect(SPEC_PARSERS.promql([{ type: 'text', text: PERSES_NO_RESULTS }])).toEqual(emptyPromql(PERSES_NO_RESULTS))
    expect(SPEC_PARSERS.promql('not an answer')).toBeNull()
    expect(emptyPromql('# Series Attribute Sets\n# Query Results per Series ID\nsomething else')).toBeNull()
    const gaps = SPEC_PARSERS.promql(PERSES_ALL_GAPS)!
    expect(gaps.series).toHaveLength(1)
    expect(gaps.series[0].values).toEqual([null, null, null, null, null, null])
})

test('/ditt0-perses reads a file and name=value settings; * is all, a,b is several, server= names the server', () => {
    expect(persesArgsOf('dash/nodes.yaml')).toEqual({ file: 'dash/nodes.yaml', variables: {}, server: '' })
    expect(persesArgsOf(' "my dash/n.json" instance=a:9100 env=prod,stage pod=* server=dash0-prod ')).toEqual({
        file: 'my dash/n.json', variables: { instance: 'a:9100', env: ['prod', 'stage'], pod: '$__all' }, server: 'dash0-prod',
    })
    expect(persesArgsOf('')).toEqual({ file: '', variables: {}, server: '' })
    expect(PERSES_COMMAND.name).toBe('ditt0-perses')
})

// ── Drawn ────────────────────────────────────────────────────────────────────────────────────────────────────────────

for (const surface of SURFACES) {
    test(`a Perses dashboard draws its variables, notes, stats, charts, pie and table, and names what stays in Dash0 on ${surface}`, async ($) => {
        const ui = await mountStory($, `${STORY}--perses`, surface)
        for (const text of ['service', 'checkout, frontend', 'kind', 'SERVER', 'Error rate', 'p95 latency', 'Requests', 'Spans by status', 'Busiest services', 'Slowest spans', 'Throughput by operation', "SpanTable panels don't draw in the terminal.", "Its SpansTimeSeriesQuery doesn't run in the terminal."])
            expect(await ui.find({ type: 'Text', text } as any)).toBeDefined()
        expect(((await ui.find({ type: 'Markdown' } as any)) as any).props.text).toMatch(/^## Checkout/)
        // The error rate is the mean of its samples, as its calculation says; the p95 had none
        const errors = parsePromql(OVERVIEW_ERRORS)!.series[0].values
        expect(await ui.find({ type: 'Text', text: formatValue(mean(errors), 'percent') } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'no data' } as any)).toBeDefined()
        // The table: a row per service, each its mean
        const api = parsePromql(OVERVIEW_BY_SERVICE)!.series.find((s: any) => s.attributes.service_name === 'api')!
        expect(await ui.find({ type: 'Text', text: formatValue(mean(api.values), '') } as any)).toBeDefined()
        await ui.unmount()
    })
}

test('the pie sums each status over the range; the chart names each service by its template', async ($) => {
    const ui = await mountStory($, `${STORY}--perses`, 'terminal', 'dark')
    for (const text of ['UNSET', 'OK', 'ERROR']) expect(await ui.find({ type: 'Text', text: new RegExp(`^${text}\\b`) } as any)).toBeDefined()
    const sums = parsePromql(PERSES_BY_STATUS)!.series.map((s: any) => s.values.reduce((a: number, b: number) => a + b, 0))
    expect(await ui.find({ type: 'Text', text: new RegExp(formatValue(sums[2], '').replace('.', '\\.')) } as any)).toBeDefined()
    for (const name of ['search', 'queue-bridge']) expect(await ui.find({ type: 'Text', text: new RegExp(name) } as any)).toBeDefined()
    await ui.unmount()
})

test('on a dataset without its metrics, every panel draws and says it has no data', async ($) => {
    const ui = await mountStory($, `${STORY}--perses-no-data`, 'terminal', 'dark')
    // CPU, load, memory, the memory gauge, disk, network, network errors; uptime is a stat
    expect(await ui.findAll({ type: 'Text', text: 'No data in this time range.' } as any)).toHaveLength(7)
    expect(await ui.find({ type: 'Text', text: 'no data' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Couldn't load/ } as any)).toBeUndefined()
    await ui.unmount()
})

// ── Live ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

test('/ditt0-perses opens a YAML dashboard from a file, asks with its variables put in, and again every 30 seconds', async ($, on) => {
    const clock = mock.clock(on, { now: Date.parse('2026-10-23T08:00:10.000Z') })
    const asked: any[] = []
    const opened: any[] = []
    const read: string[] = []
    on('fs.read', async (_: any, e: any) => { read.push(e.path); return { value: DASH0_YAML } })
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return reply(OVERVIEW_BY_SERVICE) })
    on('ui.open', async (_: any, e: any) => { opened.push(e); return { value: undefined } })
    on('ui.close', async () => ({ value: undefined }))
    const result: any = await $.command.run({ command: 'ditt0-perses', args: 'dash/spans.yaml service=checkout,frontend server=dash0-prod' } as any)
    expect(read).toHaveLength(1)
    expect(read[0]).toMatch(/(^|\/)dash\/spans\.yaml$/)
    expect(result.text).toBe('Opened the Ditt0 page "perses-spans-by-service" in a pane.')
    expect(opened[0]).toMatchObject({ id: 'ditt0-page-perses-spans-by-service', title: 'Spans by service' })
    await clock.settle()
    expect(asked.map(e => [e.server, e.tool])).toEqual([['dash0-prod', 'promql'], ['dash0-prod', 'promql']])
    // 15m: its step, 1m, is the rate window; the multi-select is a regex matcher, anchored, as Dash0 matches a regex
    // anywhere in a value
    expect(asked.map(e => e.args.query)).toEqual([
        'sum by (service_name) (rate({otel_metric_name="dash0.spans", service_name=~"^(checkout|frontend)$"}[1m]))',
        'sum(rate({otel_metric_name="dash0.spans", otel_span_status_code="ERROR", service_name=~"^(checkout|frontend)$"}[1m]))',
    ])
    const ui = await $.ui.mount({ ...PANE, requestId: 'ditt0-page-perses-spans-by-service', props: { ...PANE.props, title: 'Spans by service' } } as any)
    for (const text of ['Throughput', 'Errors', 'checkout, frontend']) expect(await ui.find({ type: 'Text', text } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /queue-bridge/ } as any)).toBeDefined()
    await clock.advance(30_000)
    expect(asked).toHaveLength(4)
    await ui.press({ key: 'close' })
    await clock.advance(60_000)
    expect(asked).toHaveLength(4)
    await ui.unmount()
})

test('/ditt0-perses without a file says how to use it; with one it cannot read, says why', async ($, on) => {
    // Nothing answers fs.read: the read fails, as a missing file does
    expect(((await $.command.run({ command: 'ditt0-perses', args: '' } as any)) as any).text).toBe('Name a Perses dashboard file: /ditt0-perses dashboards/checkout.yaml [variable=value …]')
    expect(((await $.command.run({ command: 'ditt0-perses', args: 'nope.json' } as any)) as any).text).toMatch(/^Couldn't read nope\.json: .+/)
})

test('/ditt0-perses on a file that is not a dashboard opens nothing, and says why', async ($, on) => {
    const opened: any[] = []
    on('fs.read', async () => ({ value: 'just: [text' }))
    on('ui.open', async (_: any, e: any) => { opened.push(e); return { value: undefined } })
    const text = ((await $.command.run({ command: 'ditt0-perses', args: 'notes.yaml' } as any)) as any).text
    expect(text).toMatch(/^The page did not open\.\n- perses: The Perses dashboard is not JSON or YAML: /)
    expect(opened).toEqual([])
})

test('Claude passing a Dash0 dashboard to ditt0_show opens it, asks each PromQL query, and lists what stays in Dash0', async ($, on) => {
    const clock = mock.clock(on, { now: Date.parse('2026-10-23T08:00:10.000Z') })
    const asked: any[] = []
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return reply(/histogram_quantile/.test(e.args.query) ? PERSES_ALL_GAPS : /otel_span_status_code\)/.test(e.args.query) ? PERSES_BY_STATUS : OVERVIEW_BY_SERVICE) })
    on('ui.open', async () => ({ value: undefined }))
    on('ui.close', async () => ({ value: undefined }))
    const result: any = await ($ as any).tool.call({ tool: SHOW_TOOL_NAME, perses: DASH0_STORED, variables: { service: '*' }, server: 'dash0-prod' })
    expect(result.result).toBe([
        'Opened the Ditt0 page "perses-checkout-health" in a pane.',
        "- perses: panel Slowest spans: SpanTable panels don't draw here",
        '- perses: panel Throughput by operation: SpansTimeSeriesQuery is not PromQL; not drawn',
    ].join('\n'))
    await clock.settle()
    // Error rate, p95, requests, by status, busiest services: 6h, so a 30m window
    expect(asked).toHaveLength(5)
    expect(asked.every(e => e.server === 'dash0-prod' && /\[30m\]/.test(e.args.query))).toBe(true)
    expect(asked.filter(e => /service_name=~"\^\.\*\$"/.test(e.args.query))).toHaveLength(4)
    const ui = await $.ui.mount({ ...PANE, requestId: 'ditt0-page-perses-checkout-health', props: { ...PANE.props, title: 'Checkout health' } } as any)
    expect(await ui.find({ type: 'Text', text: 'All' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Updated \d\d:\d\d:\d\d/ } as any)).toBeDefined()
    await ui.press({ key: 'close' })
    await ui.unmount()
})

test('ditt0_show with what is not a dashboard opens nothing, and tells Claude why', async ($, on) => {
    on('ui.open', async () => { throw new Error('should not open') })
    const result: any = await ($ as any).tool.call({ tool: SHOW_TOOL_NAME, perses: { panels: {} } })
    expect(result.result).toBe('The page did not open.\n- perses: A Perses dashboard is an object with a spec: { kind: "Dashboard", metadata, spec: { panels, layouts } }')
})

test("a panel whose query of three failed counts once, as a panel, and draws its other two; a gauge reads its last value", async ($, on) => {
    const clock = mock.clock(on, { now: Date.parse('2026-10-23T08:00:10.000Z') })
    on('mcp.call', async (_: any, e: any) => {
        const q = e.args.query
        if (/node_load5/.test(q)) return { value: { content: [{ type: 'text', text: 'Query timed out' }], isError: true } }
        if (/^100 - 100/.test(q)) return reply(answerOf([{ values: [70, 84.5, 86.25] }]))
        if (/node_load/.test(q)) return reply(answerOf([{ values: [0.5, 0.75, 1.25] }]))
        return reply(PERSES_NO_RESULTS)
    })
    on('ui.open', async () => ({ value: undefined }))
    on('ui.close', async () => ({ value: undefined }))
    await ($ as any).tool.call({ tool: SHOW_TOOL_NAME, perses: NODE_EXPORTER, id: 'nodes' })
    await clock.settle()
    const ui = await $.ui.mount({ ...PANE, requestId: 'ditt0-page-nodes', props: { ...PANE.props, title: 'Nodes' } } as any)
    // 8 panels ask; the load panel is the one whose query failed
    expect(await ui.find({ type: 'Text', text: /· 1 of 8 panels show older data$/ } as any)).toBeDefined()
    // Its other two queries draw, named 1m and 15m
    for (const text of [/^1m\b/, /^15m\b/]) expect(await ui.find({ type: 'Text', text } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^5m\b/ } as any)).toBeUndefined()
    // The gauge: its last value, in the warning colour of the 80% threshold it passed
    const gauge: any = await ui.find({ type: 'Text', text: '86.3%' } as any)
    expect(gauge).toBeDefined()
    await ui.press({ key: 'close' })
    await ui.unmount()
})

test('two panels showing the same series draw side by side, each its own chart', async ($, on) => {
    on('ui.open', async () => ({ value: undefined }))
    const series = [{ name: 'a', values: [1, 2, 3] }, { name: 'b', values: [3, 2, 1] }]
    const times = ['10:00', '10:05', '10:10']
    const twice = (block: any) => [{ ...block, id: `${block.type}-1`, title: 'One' }, { ...block, id: `${block.type}-2`, title: 'Two' }]
    const blocks = [
        ...twice({ type: 'timeseries', series, times }),
        ...twice({ type: 'timeseries', series, times, lineType: 'bars' }).map(b => ({ ...b, id: `${b.id}b` })),
        ...twice({ type: 'bars', bars: [{ label: 'x', value: 1 }, { label: 'y', value: 2 }] }),
        ...twice({ type: 'pie', slices: [{ label: 'x', value: 1 }, { label: 'y', value: 2 }] }),
        ...twice({ type: 'pie', variant: 'squares', slices: [{ label: 'x', value: 1 }, { label: 'y', value: 2 }] }).map(b => ({ ...b, id: `${b.id}s` })),
        ...twice({ type: 'table', columns: [{ key: 'k', label: 'K' }], rows: [{ k: 'v' }] }),
        ...twice({ type: 'gauge', value: 40, unit: 'percent' }),
        ...twice({ type: 'gantt', tasks: [{ label: 't', start: 0, end: 10 }] }),
        ...twice({ type: 'diagram', source: 'flowchart LR\n  a --> b' }),
    ]
    const result: any = await ($ as any).tool.call({ tool: SHOW_TOOL_NAME, id: 'twins', title: 'Twins', blocks })
    expect(result.result).toBe('Opened the Ditt0 page "twins" in a pane.')
    for (const surface of ['terminal', 'desktop', 'mobile']) {
        const ui = await $.ui.mount({ ...PANE, surface, requestId: 'ditt0-page-twins', props: { ...PANE.props, title: 'Twins' } } as any)
        expect(await ui.findAll({ type: 'Text', text: 'Two' } as any)).toHaveLength(9)
        await ui.unmount()
    }
})

test('a gauge whose series has only gaps says it has no data, not 0', async ($, on) => {
    const clock = mock.clock(on, { now: Date.parse('2026-10-23T08:00:10.000Z') })
    on('mcp.call', async () => reply(PERSES_ALL_GAPS))
    on('ui.open', async () => ({ value: undefined }))
    on('ui.close', async () => ({ value: undefined }))
    await ($ as any).tool.call({ tool: SHOW_TOOL_NAME, id: 'gaps', title: 'Gaps', blocks: [{ type: 'gauge', id: 'mem', title: 'Memory', unit: 'percent', promql: 'x' }] })
    await clock.settle()
    const ui = await $.ui.mount({ ...PANE, requestId: 'ditt0-page-gaps', props: { ...PANE.props, title: 'Gaps' } } as any)
    expect(await ui.find({ type: 'Text', text: 'No data in this time range.' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^0(\.0)?%$/ } as any)).toBeUndefined()
    await ui.press({ key: 'close' })
    await ui.unmount()
})
