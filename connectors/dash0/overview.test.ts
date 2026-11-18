import { test, expect } from 'claude-code/testing'

import { RANGES, settleFor, windowOf, queriesFor, loadOverview } from './overview.js'
import { OVERVIEW_REQUESTS, OVERVIEW_BY_STATUS, SERVICE_CATALOG, FAILED_CHECKS } from '../../fixtures/dash0-overview.js'

const NOW = Date.parse('2026-10-19T14:17:42.000Z')

test('a range ends on its last whole step, settled, and draws one point per step', () => {
    expect(windowOf('1h', NOW)).toEqual({ from: '2026-10-19T13:10:00.000Z', to: '2026-10-19T14:05:00.000Z' })
    for (const range of RANGES) {
        const { from, to } = windowOf(range.value, NOW)
        expect(Date.parse(to) % range.step).toBe(0)
        expect(NOW - Date.parse(to)).toBeGreaterThanOrEqual(settleFor(range.step))
        expect((Date.parse(to) - Date.parse(from)) / range.step + 1).toBe(range.ms / range.step)
    }
})

test('each panel asks the query checked against Dash0, in the range\'s step', () => {
    const q = queriesFor('1h', NOW)
    expect(q.requests).toEqual({ tool: 'promql', args: { query: 'sum(rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[5m]))', dataset: 'default', timeRange: windowOf('1h', NOW), timeSeriesOptions: { resolution: '5m' } } })
    expect(q.byService.args.query).toBe('sum by (service_name) (rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[5m])) and on (service_name) topk(8, sum by (service_name) (rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[1h] @ end())))')
    expect(q.byStatus.args.query).toBe('sum by (otel_span_status_code) (increase({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[5m]))')
    expect(queriesFor('24h', NOW).p95.args).toMatchObject({ query: 'histogram_quantile(0.95, sum by (le) (rate({otel_metric_name="dash0.spans.duration", otel_span_kind="SERVER"}[2h])))', timeSeriesOptions: { resolution: '2h' } })
    expect(q.services).toMatchObject({ tool: 'getServiceCatalog', args: { timeRange: { from: 'now-1h', to: 'now' }, sort: { by: 'requests_total' } } })
    expect(q.checks).toMatchObject({ tool: 'getFailedChecks', args: { timeRange: { from: 'now-1h', to: 'now' } } })
})

// A $ with a clock at NOW and a server answering each tool its fixture, every promql query the requests fixture;
// the tools in fail answer an error. asked: every call, as $.mcp.call took it
const engine = (fail: string[] = [], asked: any[] = []) => ({
    clock: { now: async () => NOW },
    mcp: {
        call: async (server: string, tool: string, args: any) => {
            asked.push({ server, tool, args })
            if (fail.includes('*')) throw new Error('server not connected')
            if (fail.includes(tool)) return { content: [{ type: 'text', text: 'Query timed out.' }], isError: true }
            const text = tool === 'getServiceCatalog' ? SERVICE_CATALOG : tool === 'getFailedChecks' ? FAILED_CHECKS : /status_code\)/.test(args.query) ? OVERVIEW_BY_STATUS : OVERVIEW_REQUESTS
            return { content: [{ type: 'text', text }], isError: false }
        },
    },
})

test('the panels are asked at once, through the server named, and read', async () => {
    const asked: any[] = []
    const read = await loadOverview(engine([], asked), 'dash0-prod', '1h')
    expect(asked.length).toBe(7)
    expect(asked.every(e => e.server === 'dash0-prod')).toBe(true)
    expect(read.failed).toEqual([])
    expect(read.at).toBe(NOW)
    expect(read.data.byStatus.series.map((s: any) => s.name)).toEqual(['UNSET', 'OK', 'ERROR'])
    expect(read.data.services.services.length).toBe(12)
    expect(read.data.checks.checks.length).toBe(26)
})

test('a panel whose query fails keeps its last data and is named', async () => {
    const last = { data: { checks: { checks: [{ status: 'critical', summary: 'Before', rule: 'r', since: '2026-10-19T14:00:00Z', services: [] }], link: null } }, at: NOW - 30_000 }
    const read = await loadOverview(engine(['getFailedChecks']), 'dash0-prod', '1h', last)
    expect(read.failed).toEqual(['checks'])
    expect(read.data.checks).toBe(last.data.checks)
    expect(read.at).toBe(NOW)
})

test('when every query fails, the time stays the last answer\'s', async () => {
    const read = await loadOverview(engine(['*']), 'dash0-prod', '1h', { data: {}, at: NOW - 30_000 })
    expect(read.failed.length).toBe(7)
    expect(read.at).toBe(NOW - 30_000)
})
