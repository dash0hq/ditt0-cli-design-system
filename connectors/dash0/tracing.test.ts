import { test, expect } from 'claude-code/testing'
import { parsePromql } from './promql.js'
import { queriesFor, PANELS, tracingWindowOf, statusesOf, quantilesOf, heatmapOf, extremesOf } from './tracing.js'
import { parseSpans } from './spans.js'
import { TRACING_BY_STATUS, TRACING_DURATION, TRACING_BANDS, TRACING_EXTREMES, TRACING_SPANS, TRACING_SPANS_PICKED } from '../../fixtures/dash0-tracing.js'

const NOW = Date.parse('2026-10-19T16:10:40.000Z')
const H = '{otel_metric_name="dash0.spans.duration", otel_span_kind="SERVER"}'

test('each tracing panel asks the query checked against Dash0, over a window ending on the step now is in', () => {
    const q = queriesFor('15m', NOW)
    expect(PANELS).toBe(5)
    expect(tracingWindowOf('15m', NOW)).toEqual({ from: '2026-10-19T15:56:00.000Z', to: '2026-10-19T16:10:00.000Z' })
    expect(q.byStatus).toEqual({ tool: 'promql', args: { query: 'sum by (otel_span_status_code) (increase({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[1m]))', dataset: 'default', timeRange: tracingWindowOf('15m', NOW), timeSeriesOptions: { resolution: '1m' } } })
    expect(q.duration.args.query).toBe(
        ['p99', 'p95', 'p90', 'p75', 'p50'].map((n, i) => `label_replace(histogram_quantile(${[0.99, 0.95, 0.9, 0.75, 0.5][i]}, sum(rate(${H}[1m]))), "q", "${n}", "", "")`).join(' or ')
        + ` or label_replace(histogram_avg(sum(rate(${H}[1m]))), "q", "Avg", "", "")`)
    const counts = `sum by (otel_span_status_code) (increase(${H}[1m]))`
    expect(q.bands.args.query.startsWith(`label_replace(histogram_fraction(0, 0.001, ${counts}) * histogram_count(${counts}), "band", "0", "", "") or `)).toBe(true)
    expect(q.bands.args.query.endsWith(`label_replace(histogram_fraction(10, +Inf, ${counts}) * histogram_count(${counts}), "band", "7", "", "")`)).toBe(true)
    expect(q.extremes.args).toEqual({ query: `label_replace(histogram_quantile(0.99, sum(increase(${H}[15m]))), "q", "p99", "", "") or label_replace(histogram_quantile(1, sum(increase(${H}[15m]))), "q", "max", "", "")`, dataset: 'default', timestamp: '2026-10-19T16:10:00.000Z' })
    expect(q.spans).toEqual({ tool: 'getSpans', args: { dataset: 'default', timeRange: { from: 'now-15m', to: 'now' }, filters: [{ key: 'otel.span.kind', operator: 'is', value: 'SERVER' }], pagination: { limit: 15 }, spanAttributeKeys: ['dash0.span.type'] } })
    // 1h: 5-minute steps, the range's own spans
    expect(queriesFor('1h', NOW).byStatus.args.timeSeriesOptions.resolution).toBe('5m')
    expect(queriesFor('1h', NOW).spans.args.timeRange).toEqual({ from: 'now-1h', to: 'now' })
})

test('a picked span asks the spans of exactly that time', () => {
    const q = queriesFor('15m', NOW, { selection: { from: Date.parse('2026-10-19T16:02:00.000Z'), to: Date.parse('2026-10-19T16:05:00.000Z') } })
    expect(q.spans.args.timeRange).toEqual({ from: '2026-10-19T16:02:00.000Z', to: '2026-10-19T16:05:00.000Z' })
    expect(q.byStatus).toEqual(queriesFor('15m', NOW).byStatus)
})

test('the answers read into what each chart draws', () => {
    const statuses = statusesOf(parsePromql(TRACING_BY_STATUS)!)
    expect(statuses.error.slice(-2)).toEqual([4, 22])
    expect(statuses.rest[0]).toBe(46164 + 1249)
    const quantiles = quantilesOf(parsePromql(TRACING_DURATION)!)
    expect(quantiles.series.map(s => s.name)).toEqual(['p99', 'p95', 'p90', 'p75', 'p50', 'Avg'])
    expect(quantiles.series[0].values[2]).toBe(219.4698)
    const cells = heatmapOf(parsePromql(TRACING_BANDS)!)
    expect(cells.error).toHaveLength(8)
    expect(cells.error[6][14]).toBe(19.0085)
    expect(Math.abs(cells.ok[0][0] - 17991.7403)).toBeLessThan(1e-6)
    // OK and UNSET together; a blank ERROR cell is no errors
    expect(Math.abs(cells.ok[1][0] - (242.6727 + 4841.6452))).toBeLessThan(1e-6)
    expect(cells.error[0][0]).toBe(0)
    expect(extremesOf(parsePromql(TRACING_EXTREMES)!)).toEqual({ max: 259.8098, p99: 2.112 })
})

test('getSpans answers read into spans: start, service, name, duration in seconds, status, root and type, plus the explorer link', () => {
    const read = parseSpans(TRACING_SPANS)!
    expect(read.spans).toHaveLength(15)
    expect(read.spans[0]).toEqual({ start: Date.parse('2026-10-19T16:10:35.457Z'), service: 'api', name: 'POST /api/prometheus/api/v1/query_range', duration: 0.001, status: 'UNSET', root: true, type: 'http' })
    expect(read.spans[6]).toMatchObject({ root: false, service: 'order-history-api' })
    expect(read.link).toMatch(/^https:\/\/app\.dash0\.com\/goto\/traces\/explorer\?/)
    expect(parseSpans(TRACING_SPANS_PICKED)!.spans.map(s => s.type)).toContain('tworkflow')
})

test('an answer that is not a spans table reads as null, so the page keeps what it had', () => {
    expect(parseSpans('Query timed out.')).toBeNull()
    expect(parseSpans('| a | b |\n| - | - |\n| 1 | 2 |')).toBeNull()
})
