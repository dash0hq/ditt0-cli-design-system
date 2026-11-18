import { test, expect, mock } from 'claude-code/testing'

import { unitOf, rollForward, zoneOf, clockTime, serverOf, toolOf, parsePromql } from './promql.js'
import { remember, track, setAuto, REFRESH_MS, MAX_LIVE } from './live.js'
import { PROMQL_ONE_SERIES } from '../../fixtures/promql.js'

const TOOL = 'mcp__claude_ai_Dash0__promql'
const SPANS = 'sum(increase({otel_metric_name="dash0.spans"}[5m]))'
// The fixture's answer ended 07:45:05 UTC; the query covered the 10 minutes before it
const ARGS = { query: SPANS, dataset: 'default', timeRange: { from: '2026-10-19T07:35:05.000Z', to: '2026-10-19T07:45:05.000Z' } }
const START = Date.parse('2026-10-19T07:45:10.000Z')

// The answer a refresh gets: one series, its samples at the times asked for
const answer = (from: number, values: number[]) => `# Series Attribute Sets
| Series ID |
| :-------- |
| #1        |

# Query Results per Series ID
| Timestamp                | #1       |
| :----------------------- | :------- |
${values.map((v, i) => `| ${new Date(from + i * 300_000).toISOString()} | ${v} |`).join('\n')}
`

test('a query names the unit its values are in', () => {
    expect(unitOf('histogram_quantile(0.95, sum by (le) (rate({otel_metric_name="dash0.spans.duration"}[5m])))')).toBe('seconds')
    expect(unitOf('histogram_quantile(0.95, sum by (le) (rate({otel_metric_name="dash0.spans.duration"}[5m]))) * 1000')).toBe('milliseconds')
    expect(unitOf('sum(rate(http_server_request_duration_seconds_sum[5m])) / sum(rate(http_server_request_duration_seconds_count[5m]))')).toBe('seconds')
    expect(unitOf('sum(container_memory_working_set_bytes)')).toBe('bytes')
    expect(unitOf('sum(rate({otel_metric_name="dash0.spans"}[5m]))')).toBe('/s')
    expect(unitOf(SPANS)).toBe('')
    // Rescaled another way: no unit rather than a wrong one
    expect(unitOf('sum(rate({otel_metric_name="dash0.spans.duration_sum"}[5m])) / 60')).toBe('')
})

test('a refresh asks for the same span, ending now', () => {
    const now = Date.parse('2026-10-19T09:00:00.000Z')
    expect(rollForward(ARGS, now)).toEqual({ query: SPANS, dataset: 'default', timeRange: { from: '2026-10-19T08:50:00.000Z', to: '2026-10-19T09:00:00.000Z' } })
    expect(rollForward({ query: SPANS, dataset: 'default', timeRange: { from: 'now-1h', to: 'now' } }, now).timeRange).toEqual({ from: 'now-1h', to: 'now' })
    expect(rollForward({ query: SPANS, dataset: 'default', timestamp: '2026-10-19T07:00:00.000Z' }, now).timestamp).toBe('2026-10-19T09:00:00.000Z')
})

test('times are the local clock, and the zone is named', () => {
    const at = Date.parse('2026-10-19T07:35:05.000Z')
    const d = new Date(at)
    expect(clockTime(at)).toBe(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    expect(clockTime(at, { seconds: true })).toMatch(/^\d\d:\d\d:05$/)
    expect(zoneOf(at)).toMatch(/^(UTC|GMT[+-]\d{1,2}(:\d\d)?)$/)
    expect(parsePromql(PROMQL_ONE_SERIES)!.times[0]).toBe(clockTime(at))
})

test('a tool name gives the server and tool a refresh calls', () => {
    expect([serverOf(TOOL), toolOf(TOOL)]).toEqual(['claude_ai_Dash0', 'promql'])
    expect([serverOf('mcp__dash0-prod__promql'), toolOf('mcp__dash0-prod__promql')]).toEqual(['dash0-prod', 'promql'])
})

test(`a result drawn without its arguments takes them from its tool call, and only ${MAX_LIVE} refresh at once`, () => {
    const timers: { cancelled: boolean }[] = []
    const $: any = { clock: { every: () => { const t = { cancelled: false, cancel: () => { t.cancelled = true } }; timers.push(t); return t } } }
    remember('r1', { tool: TOOL, tool_use_id: 'r1', ...ARGS })
    const first = track($, { tool_use_id: 'r1', tool: TOOL, output: PROMQL_ONE_SERIES }, START)!
    expect(first.args).toEqual(ARGS)
    expect(first.auto).toBe(true)
    const rest = ['r2', 'r3', 'r4'].map(id => track($, { tool_use_id: id, tool: TOOL, input: ARGS, output: PROMQL_ONE_SERIES }, START)!)
    // The fourth live result stops the oldest
    expect(first.auto).toBe(false)
    expect(timers[0].cancelled).toBe(true)
    expect(rest.every(e => e.auto)).toBe(true)
    setAuto($, rest[0], false)
    expect(rest[0].auto).toBe(false)
})

test('a live result runs its query again every 30 seconds, draws the answer, and says when it came', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    on('ui.render', async ($: any, e: any) => $.ui.resolve(e).Text({ children: ['engine drawing'] }))
    const asked: any[] = []
    on('mcp.call', async (_: any, e: any) => {
        asked.push(e)
        return { value: { content: [{ type: 'text', text: answer(Date.parse(e.args.timeRange.from), [4100, 4200, 4300]) }], isError: false } }
    })
    const call = { tool_use_id: 'live-1', tool: TOOL, input: ARGS, isRunning: false, isErrored: false, isInterrupted: false, output: [{ type: 'text', text: PROMQL_ONE_SERIES }] }
    const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface: 'terminal', component: 'ToolGroup', requestId: 'g-live', props: { calls: [call], isActive: false, isExpanded: false } } as any)
    const zone = zoneOf(START)
    expect(await ui.find({ type: 'Text', text: `Updated ${clockTime(START, { seconds: true })} (${zone})` } as any)).toBeDefined()

    await clock.advance(REFRESH_MS)
    const now = START + REFRESH_MS
    expect(asked[0]).toMatchObject({ server: 'claude_ai_Dash0', tool: 'promql', args: { query: SPANS, timeRange: { to: new Date(now).toISOString() } } })
    const updated = async () => ui.find({ type: 'Text', text: `Updated ${clockTime(now, { seconds: true })} (${zone})` } as any)
    for (let i = 0; i < 50 && !(await updated()); i++) await clock.settle()
    expect(await updated()).toBeDefined()

    // Off, it stops asking and says which moment it shows
    await ui.press({ key: 'auto-refresh-live-1' })
    expect(await ui.find({ type: 'Text', text: `Snapshot · ${clockTime(now)} (${zone})` } as any)).toBeDefined()
    await clock.advance(REFRESH_MS * 2)
    expect(asked.length).toBe(1)
    await ui.unmount()
})

test('a refresh that fails keeps the data it had and says so', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    on('ui.render', async ($: any, e: any) => $.ui.resolve(e).Text({ children: ['engine drawing'] }))
    on('mcp.call', async () => ({ value: { content: [{ type: 'text', text: 'Query timed out.' }], isError: true } }))
    const call = { tool_use_id: 'live-2', tool: TOOL, input: ARGS, isRunning: false, isErrored: false, isInterrupted: false, output: [{ type: 'text', text: PROMQL_ONE_SERIES }] }
    const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface: 'terminal', component: 'ToolGroup', requestId: 'g-fail', props: { calls: [call], isActive: false, isExpanded: false } } as any)
    await clock.advance(REFRESH_MS)
    const failed = async () => ui.find({ type: 'Text', text: /^Couldn't refresh\. Showing data from / } as any)
    for (let i = 0; i < 50 && !(await failed()); i++) await clock.settle()
    expect(await failed()).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /[─╭╮╰╯\u2801-\u28ff]/ } as any)).toBeDefined()
    await ui.unmount()
})
