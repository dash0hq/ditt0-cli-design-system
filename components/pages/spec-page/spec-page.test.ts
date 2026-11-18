import { test, expect, mock } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'
import { MINI_TRACING, DEPLOYS, SHAPES } from './examples.js'
import { normalizeSpec, queriesOf, inlineOf, specPageOf, applyUpdate, showAnswer, SHOW_TOOL, SHOW_TOOL_NAME, paneOf } from '../../../connectors/spec-page.js'
import { OVERVIEW_REQUESTS, OVERVIEW_ERRORS, OVERVIEW_P95 } from '../../../fixtures/dash0-overview.js'
import { SPEC_ERROR_SPANS } from '../../../fixtures/ditt0-spec-page.js'

const STORY = 'features-ditt0-pages-spec-page'
const FRESH = /^Updated \d\d:\d\d:\d\d \((UTC|GMT[+-][\d:]+)\)$/

for (const surface of SURFACES) {
    test(`a spec page draws its stats, charts, spans and one Open in Dash0 on ${surface}`, async ($) => {
        const ui = await mountStory($, `${STORY}--default`, surface)
        for (const text of ['Span rate', 'Error rate', 'P95', 'Requests', 'Errors', 'Duration', 'Error spans', 'POST /api/spans/attributes/keys'])
            expect(await ui.find({ type: 'Text', text } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: FRESH } as any)).toBeDefined()
        const links: any[] = await ui.findAll({ type: 'Link' } as any)
        expect(links).toHaveLength(1)
        expect(links[0].props.href).toMatch(/^https:\/\/app\.dash0\.com\/goto\/metrics\//)
        await ui.unmount()
    })

    test(`a spec page of a mod's own data draws it with no range or Auto-refresh on ${surface}`, async ($) => {
        const ui = await mountStory($, `${STORY}--inline`, surface)
        for (const text of ['Deploys by day', 'Latest', 'checkout', 'Lead time'])
            expect(await ui.find({ type: 'Text', text } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: FRESH } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'Time range' } as any)).toBeUndefined()
        await ui.unmount()
    })
}

test('every timeseries block draws its own Dots, Lines and Bars and zoom', async ($) => {
    const ui = await mountStory($, `${STORY}--default`, 'terminal')
    const buttons: any[] = await ui.findAll({ type: 'Button' } as any)
    const labels = buttons.map(b => String(b.props.label ?? ''))
    expect(labels.filter(l => /Dots$/.test(l))).toHaveLength(3)
    expect(labels.filter(l => /Bars$/.test(l))).toHaveLength(3)
    await ui.unmount()
})

test('before Dash0 answers, the page and each block say they are loading', async ($) => {
    const ui = await mountStory($, `${STORY}--loading`, 'terminal')
    const loaders: any[] = await ui.findAll({ type: 'Client' } as any)
    expect(loaders.filter(c => c.props.props?.label === 'Loading from Dash0…')).toHaveLength(1)
    // 3 stats, 3 charts, the spans table
    expect(loaders.filter(c => /^Loading .+…$/.test(c.props.props?.label ?? '') && c.props.props.frames.includes('■'))).toHaveLength(7)
    await ui.unmount()
})

test('a block whose query failed says so, and the rest draw', async ($) => {
    const ui = await mountStory($, `${STORY}--panel-failed`, 'terminal')
    expect(await ui.find({ type: 'Text', text: "Couldn't load error spans" } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Requests' } as any)).toBeDefined()
    await ui.unmount()
})

test('a spec gets a key per data block, and names what it left out', () => {
    const { spec, problems } = normalizeSpec({ id: 'p', title: 'P', blocks: [{ type: 'row', blocks: [{ type: 'timeseries', promql: 'up' }] }, { type: 'map' }, { type: 'stats', items: [{ label: 'A', value: 1 }] }] })
    expect(spec!.blocks[0].blocks[0].key).toBe('b0.0')
    expect(spec!.blocks[1].items[0].key).toBe('b2.0')
    expect(problems).toEqual(['blocks 1: unknown type "map"; one of heading, text, markdown, stats, timeseries, bars, pie, gauge, gantt, diagram, table, badge, tags, link, row, column, card'])
    expect(normalizeSpec({ title: 'x', blocks: [] }).spec).toBeNull()
    expect(normalizeSpec('nope').problems.length).toBe(1)
    // Only JSON crosses: a function is dropped
    expect(normalizeSpec({ id: 'f', title: 'F', blocks: [{ type: 'text', text: 'a', onClick: () => 1 }] }).spec!.blocks[0].onClick).toBeUndefined()
})

test('a promql block asks over the page range, its step as the rate window; a spans table asks getSpans', () => {
    const { spec } = normalizeSpec(MINI_TRACING)
    const queries = queriesOf(spec!)('1h', Date.parse('2026-10-19T14:17:42.000Z'))
    expect(Object.keys(queries)).toEqual(['rate-now', 'errors-now', 'p95-now', 'rate', 'errors', 'p95', 'spans'])
    expect(queries.rate).toEqual({
        tool: 'promql',
        args: {
            query: 'sum(rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[5m]))',
            dataset: 'default',
            timeRange: { from: '2026-10-19T13:10:00.000Z', to: '2026-10-19T14:05:00.000Z' },
            timeSeriesOptions: { resolution: '5m' },
        },
    })
    expect(queries.spans.tool).toBe('getSpans')
    expect((queries.spans.args as any).pagination).toEqual({ limit: 5 })
    expect((queries.spans.args as any).timeRange).toEqual({ from: 'now-1h', to: 'now' })
    // The page's dataset, for every block that names none
    const other = queriesOf(normalizeSpec({ ...MINI_TRACING, dataset: 'staging' }).spec!)('1h', 0)
    expect(Object.values(other).every((q: any) => q.args.dataset === 'staging')).toBe(true)
})

test("a page of inline data asks nothing, and an update replaces a block's data by its id", () => {
    const { spec } = normalizeSpec(DEPLOYS)
    expect(Object.keys(queriesOf(spec!)('1h', 0))).toEqual([])
    expect(Object.keys(inlineOf(spec!))).toEqual(['count', 'lead', 'by-day', 'recent'])
    const page = specPageOf(spec!, 'dash0-prod')
    expect(page.spec.id).toBe(paneOf('deploys'))
    expect(page.asks).toBe(0)
    const problems = applyUpdate(page, { id: 'deploys', data: { count: { value: 24 }, nope: { value: 1 } } }, 5)
    expect(page.inline.count).toEqual({ value: 24 })
    expect(page.inlineAt).toBe(5)
    expect(problems).toEqual(['data nope: no block has that id'])
    // New blocks: a promql block in them makes the page ask
    applyUpdate(page, { id: 'deploys', blocks: [{ type: 'timeseries', id: 'rate', promql: 'up' }] }, 6)
    expect(page.asks).toBe(1)
    expect(Object.keys(page.spec.queries('1h', 0))).toEqual(['rate'])
})

test('pie, gantt and diagram blocks draw a PieChart or SquareChart, a GanttChart and a FlowDiagram', async ($) => {
    const { spec, problems } = normalizeSpec(SHAPES)
    expect(problems).toEqual([])
    expect(Object.keys(inlineOf(spec!))).toEqual(['status', 'kind', 'steps'])
    const ui = await mountStory($, `${STORY}--shapes`, 'terminal', 'dark')
    for (const text of ['Spans by status', 'Spans by kind', 'Deploy steps', 'Request path', 'Canary'])
        expect(await ui.find({ type: 'Text', text } as any)).toBeDefined()
    // The round pie's quarter blocks, the waffle's squares, the gantt's milestone and the diagram's boxes
    expect(await ui.find({ type: 'Text', text: /[▗▖▝▘▟▙▜▛]/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^◆$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Postgres/ } as any)).toBeDefined()
    await ui.unmount()
})

test('a pie block asks promql like a chart, a slice per series at its last sample', () => {
    const { spec } = normalizeSpec({ id: 'p', title: 'P', blocks: [{ type: 'pie', id: 'by-kind', promql: 'sum by (otel_span_kind) (rate({otel_metric_name="dash0.spans"}[$step]))' }] })
    expect(Object.keys(queriesOf(spec!)('1h', 0))).toEqual(['by-kind'])
    expect(SHOW_TOOL.description).toMatch(/pie \(parts of one whole/)
    expect(SHOW_TOOL.description).toMatch(/gantt/)
    expect(SHOW_TOOL.description).toMatch(/diagram \(Mermaid/)
})

test('the ditt0_show tool takes a page spec, or a Perses dashboard, and its answer says what opened', () => {
    expect(SHOW_TOOL_NAME).toBe(`mcp__ditt0-cli-design-system__${SHOW_TOOL.name}`)
    // Nothing is required by the schema: blocks, or perses, and the rest normalizeSpec checks and names
    expect((SHOW_TOOL.inputSchema as any).required).toBeUndefined()
    expect(Object.keys((SHOW_TOOL.inputSchema as any).properties)).toEqual(['id', 'title', 'server', 'dataset', 'range', 'refreshMs', 'blocks', 'perses', 'variables'])
    expect(SHOW_TOOL.description).toMatch(/Perses dashboard/)
    expect(showAnswer({ id: 'p', opened: true })).toBe('Opened the Ditt0 page "p" in a pane.')
    expect(showAnswer({ id: 'p', opened: false, problems: ['x'] })).toBe('The Ditt0 page "p" is ready, but no pane can be drawn here.\n- x')
})

// What the server answers each query
const answer = (e: any) => {
    const text = e.tool === 'getSpans' ? SPEC_ERROR_SPANS
        : /histogram_quantile/.test(e.args.query) ? OVERVIEW_P95
        : /ERROR/.test(e.args.query) ? OVERVIEW_ERRORS
        : OVERVIEW_REQUESTS
    return { value: { content: [{ type: 'text', text }], isError: false } }
}

test('Claude calling ditt0_show opens the page, asks every query, again every 30 seconds, and stops on Close', async ($, on) => {
    const clock = mock.clock(on, { now: Date.parse('2026-10-19T14:17:42.000Z') })
    const asked: any[] = []
    const opened: any[] = []
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return answer(e) })
    on('ui.open', async (_: any, e: any) => { opened.push(e); return { value: undefined } })
    on('ui.close', async () => ({ value: undefined }))
    const result: any = await ($ as any).tool.call({ tool: SHOW_TOOL_NAME, ...MINI_TRACING, server: 'dash0-prod' })
    expect(result.result).toBe('Opened the Ditt0 page "mini-tracing" in a pane.')
    expect(opened[0].id).toBe('ditt0-page-mini-tracing')
    await clock.settle()
    expect(asked).toHaveLength(7)
    expect(asked.every(e => e.server === 'dash0-prod')).toBe(true)

    const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface: 'terminal', component: 'Pane', requestId: 'ditt0-page-mini-tracing', props: { title: 'Mini tracing', isFocused: true } } as any)
    expect(await ui.find({ type: 'Text', text: 'POST /api/spans/attributes/keys' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: FRESH } as any)).toBeDefined()
    await clock.advance(30_000)
    expect(asked).toHaveLength(14)
    await ui.press({ key: 'close' })
    await clock.advance(60_000)
    expect(asked).toHaveLength(14)
    await ui.unmount()
})

test('the tool tells Claude to show numbers with it, data it already has too, inline', () => {
    expect(SHOW_TOOL.description).toMatch(/in place of a markdown table/)
    expect(SHOW_TOOL.description).toMatch(/data you already have too/)
})
