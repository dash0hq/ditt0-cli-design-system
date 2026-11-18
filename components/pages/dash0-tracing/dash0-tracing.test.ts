import { test, expect, mock } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'
import { REFRESH_MS } from '../../../connectors/dash0/overview.js'
import { durationText } from './dash0-tracing.jsx'
import {
    TRACING_BY_STATUS, TRACING_DURATION, TRACING_BANDS, TRACING_EXTREMES, TRACING_SPANS, TRACING_SPANS_PICKED,
} from '../../../fixtures/dash0-tracing.js'

const STORY = 'features-dash0-pages-tracing'
const FRESH = /^Updated \d\d:\d\d:\d\d \((UTC|GMT[+-][\d:]+)\)$/

for (const surface of SURFACES) {
    test(`the tracing page heads All spans, filters on server spans and opens on RED: Spans, Errors and Duration, on ${surface}`, async ($) => {
        const ui = await mountStory($, `${STORY}--default`, surface)
        expect(await ui.find({ type: 'Text', text: 'Built-in views ›' } as any)).toMatchObject({ props: { dimColor: true } })
        expect(await ui.find({ type: 'Text', text: 'All spans' } as any)).toMatchObject({ props: { bold: true } })
        expect(await ui.find({ type: 'Text', text: 'Group by None' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'otel.span.kind' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: FRESH } as any)).toBeDefined()
        for (const title of ['Chart', 'Spans', 'Errors', 'Duration', 'Table']) expect((await ui.findAll({ type: 'Text', text: title } as any)).length).toBeGreaterThan(0)
        // The quantiles and the mean, on one axis, each named in its legend
        for (const name of ['p99', 'p95', 'p90', 'p75', 'p50', 'Avg']) expect(await ui.find({ type: 'Text', text: name } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'OK & UNSET' } as any)).toBeDefined()
        // The one CTA opens the explorer with the same filter
        const links: any[] = await ui.findAll({ type: 'Link' } as any)
        expect(links.some(l => /traces\/explorer\?.*SERVER/.test(l.props.href))).toBe(true)
        expect(links.every(l => /^https:\/\/app\.dash0\.com\//.test(l.props.href))).toBe(true)
        await ui.unmount()
    })
}

test('the spans table writes each column as the explorer does', async ($) => {
    const ui = await mountStory($, `${STORY}--picked`, 'terminal', 'dark')
    for (const label of ['Name', 'Service', 'Start Time', 'Duration', 'Root', 'Type', 'Kind']) expect(await ui.find({ type: 'Text', text: label } as any)).toBeDefined()
    // Start to the millisecond, on the person's clock
    expect(await ui.find({ type: 'Text', text: /^\d\d:\d\d:59\.993$/ } as any)).toBeDefined()
    // 1.196 s, 0.084 s and 4e-4 s
    expect(await ui.find({ type: 'Text', text: '1,196ms' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '84ms' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '< 1ms' } as any)).toBeDefined()
    // dash0.span.type, as the explorer writes it, and ROOT only for spans without a parent: 12 of 15
    for (const type of ['HTTP', 'TACTIVITY', 'TWORKFLOW']) expect(await ui.find({ type: 'Text', text: type } as any)).toBeDefined()
    expect(await ui.findAll({ type: 'Text', text: ' ROOT ' } as any)).toHaveLength(12)
    expect(await ui.findAll({ type: 'Text', text: ' SERVER ' } as any)).toHaveLength(15)
    // The picked span, over the table, with its ✕
    expect(await ui.find({ type: 'Text', text: /^\d\d:02:00 – \d\d:05:00$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'remove-timerange' } as any)).toBeDefined()
    await ui.unmount()
})

test('durations: whole milliseconds with a thousands separator, < 1ms under one', () => {
    expect(durationText(4e-4)).toBe('< 1ms')
    expect(durationText(0.001)).toBe('1ms')
    expect(durationText(1.8124)).toBe('1,812ms')
    expect(durationText(287.2159)).toBe('287,216ms')
})

test('an ERROR span\'s name is in the error red', async ($) => {
    const ui = await mountStory($, `${STORY}--default`, 'terminal', 'dark')
    const names: any[] = await ui.findAll({ type: 'Text', text: 'POST /api/prometheus/api/v1/query_range' } as any)
    expect(names.some(t => t.props.color === '#e33238')).toBe(true)
    await ui.unmount()
})

test('the chart toggles between Outliers, RED and None', async ($) => {
    const ui = await mountStory($, `${STORY}--default`, 'terminal')
    expect(await ui.find({ type: 'Button', key: `tab-red` } as any)).toMatchObject({ props: { dimColor: false } })
    await ui.press({ key: `tab-outliers` })
    expect(await ui.find({ type: 'Text', text: '4.33 min' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ *0 ┤$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'p90' } as any)).toBeUndefined()
    await ui.press({ key: `tab-none` })
    expect(await ui.find({ type: 'Text', text: '4.33 min' } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'p90' } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'Start Time' } as any)).toBeDefined()
    await ui.unmount()
})

test('before Dash0 answers, the page spins and every panel pulses', async ($) => {
    const ui = await mountStory($, `${STORY}--loading`, 'terminal')
    const loaders: any[] = await ui.findAll({ type: 'Client' } as any)
    expect(loaders.filter(c => c.props.props?.label === 'Loading from Dash0…')).toHaveLength(1)
    // spans, errors, durations, the spans list
    expect(loaders.filter(c => /^Loading .+…$/.test(c.props.props?.label ?? '') && c.props.props.frames.includes('■'))).toHaveLength(4)
    await ui.unmount()
})

test('a refresh that failed for some panels keeps their data and says how many', async ($) => {
    const ui = await mountStory($, `${STORY}--refresh-failed`, 'terminal')
    expect(await ui.find({ type: 'Text', text: /· 2 of 5 panels show older data$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'p99' } as any)).toBeDefined()
    await ui.unmount()
})

// What the server answers each panel; a getSpans with an absolute time range is a picked span
const answer = async (_: any, e: any) => {
    const text = e.tool === 'getSpans' ? (/^now/.test(e.args.timeRange.from) ? TRACING_SPANS : TRACING_SPANS_PICKED)
        : /histogram_fraction/.test(e.args.query) ? TRACING_BANDS
        : e.args.timestamp ? TRACING_EXTREMES
        : /histogram_quantile/.test(e.args.query) ? TRACING_DURATION
        : TRACING_BY_STATUS
    return { value: { content: [{ type: 'text', text }], isError: false } }
}

const PANE = { plugin: 'ditt0-cli-design-system', surface: 'terminal', component: 'Pane', requestId: 'dash0-tracing', props: { title: 'Dash0 tracing', isFocused: true } }
const NOW = Date.parse('2026-10-19T16:10:40.000Z')

test('/dash0-tracing asks the server named for every panel, live to now, then again every 30 seconds until Auto is off', async ($, on) => {
    const clock = mock.clock(on, { now: NOW })
    const asked: any[] = []
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return answer(_, e) })
    on('ui.open', async () => ({ value: undefined }))
    await $.command.run({ command: 'dash0-tracing', args: 'dash0-prod' } as any)
    await clock.settle()
    expect(asked.length).toBe(5)
    expect(asked.every(e => e.server === 'dash0-prod')).toBe(true)
    // The window ends on the minute now is in: no settle hold-back
    expect(asked.find(e => e.tool === 'promql' && e.args.timeRange).args.timeRange).toEqual({ from: '2026-10-19T15:56:00.000Z', to: '2026-10-19T16:10:00.000Z' })
    expect(asked.find(e => e.tool === 'getSpans').args).toMatchObject({ timeRange: { from: 'now-15m', to: 'now' }, spanAttributeKeys: ['dash0.span.type'], pagination: { limit: 15 } })

    const ui = await $.ui.mount(PANE as any)
    expect(await ui.find({ type: 'Text', text: FRESH } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /retrieve-open-orders/ } as any)).toBeDefined()

    await clock.advance(REFRESH_MS)
    expect(asked.length).toBe(10)

    // Another range asks again at once, in its own step
    await ui.select({ key: 'tracing-range', value: '6h' } as any)
    await clock.settle()
    expect(asked.length).toBe(15)
    expect(asked.slice(-5).filter(e => e.tool === 'promql' && e.args.timeSeriesOptions).every(e => e.args.timeSeriesOptions.resolution === '30m')).toBe(true)

    // Off, it stops asking
    await ui.press({ key: 'tracing-auto-refresh' })
    await clock.advance(REFRESH_MS * 3)
    expect(asked.length).toBe(15)
    expect(await ui.find({ type: 'Text', text: /^Snapshot · \d\d:\d\d/ } as any)).toBeDefined()
    await ui.unmount()
})

test('dragging across the Duration chart asks the spans of that time, keeps them through a refresh, and ✕ goes back to the latest', async ($, on) => {
    const clock = mock.clock(on, { now: NOW })
    const asked: any[] = []
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return answer(_, e) })
    on('ui.open', async () => ({ value: undefined }))
    await $.command.run({ command: 'dash0-tracing', args: 'dash0-prod' } as any)
    await clock.settle()
    const ui = await $.ui.mount(PANE as any)
    // The Duration chart's plot: the last of the charts drawn by their own Client
    const clients: any[] = (await ui.findAll({ type: 'Client' } as any)).filter((c: any) => /timeseries\.client\.js$/.test(c.props.module))
    expect(clients).toHaveLength(2)
    const key = clients[1].props.key
    await ui.resize({ columns: 30, rows: 12, in: key })
    const chart: any = (await ui.findAll({ type: 'Client' } as any)).find((c: any) => c.props.key === key)
    const offset = chart.props.props.offset
    const per = chart.props.props.columns / 15
    // From the 16:03 sample to the 16:05 one: 16:02 to 16:05
    await ui.pointer({ type: 'down', x: offset + Math.floor(7.5 * per), y: 1, button: 'left', in: key })
    await ui.pointer({ type: 'move', x: offset + Math.floor(9.5 * per), y: 1, in: key })
    await ui.pointer({ type: 'up', x: offset + Math.floor(9.5 * per), y: 1, button: 'left', in: key })
    await clock.settle()
    const picked = asked.filter(e => e.tool === 'getSpans').pop()
    expect(picked.args.timeRange).toEqual({ from: '2026-10-19T16:02:00.000Z', to: '2026-10-19T16:05:00.000Z' })
    expect(await ui.find({ type: 'Text', text: /RunWorkflow:reserve_stock_batch/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^\d\d:02:00 – \d\d:05:00$/ } as any)).toBeDefined()

    // A refresh keeps the pick: the spans are still that time's
    await clock.advance(REFRESH_MS)
    expect(asked.filter(e => e.tool === 'getSpans').pop().args.timeRange.from).toBe('2026-10-19T16:02:00.000Z')
    expect(await ui.find({ type: 'Text', text: /RunWorkflow:reserve_stock_batch/ } as any)).toBeDefined()

    await ui.press({ key: 'remove-timerange' })
    await clock.settle()
    expect(asked.filter(e => e.tool === 'getSpans').pop().args.timeRange).toEqual({ from: 'now-15m', to: 'now' })
    expect(await ui.find({ type: 'Text', text: /RunWorkflow:reserve_stock_batch/ } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /retrieve-open-orders/ } as any)).toBeDefined()
    await ui.unmount()
})

test('without a server named, and no Dash0 call yet, /dash0-tracing asks claude.ai\'s Dash0', async ($, on) => {
    const asked: any[] = []
    const clock = mock.clock(on, { now: NOW })
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return answer(_, e) })
    on('ui.open', async () => ({ value: undefined }))
    await $.command.run({ command: 'dash0-tracing', args: '' } as any)
    await clock.settle()
    expect(asked.length).toBe(5)
    expect(asked.every(e => e.server === 'claude.ai Dash0')).toBe(true)
})
