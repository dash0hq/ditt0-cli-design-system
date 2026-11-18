import { Dash0QueryResult } from './dash0-query-result.jsx'
import { parsePromql, unitOf } from '../../../connectors/dash0/promql.js'
import { PROMQL_ONE_SERIES, PROMQL_BY_SERVICE } from '../../../fixtures/promql.js'

// The time the fixtures' answers came, 2026-10-19 08:05:10 UTC
const ANSWERED = Date.parse('2026-10-19T08:05:10.000Z')
const P95 = 'histogram_quantile(0.95, sum by (le) (rate({otel_metric_name="dash0.spans.duration"}[5m]))) * 1000'

export default {
    title: 'Features/Dash0/Pages/Query Result',
    component: Dash0QueryResult,
    actions: ['onAutoChange'],
    argsOnAction: { onAutoChange: (auto) => ({ live: { id: 'story', canRefresh: true, auto, at: ANSWERED, failed: false } }) },
}

export const Default = { args: { result: parsePromql(PROMQL_ONE_SERIES) } }
export const ByService = { args: { result: parsePromql(PROMQL_BY_SERVICE) } }
// Refreshing every 30 seconds, its p95 latency in milliseconds as the query's * 1000 says
export const Live = { args: { result: parsePromql(PROMQL_ONE_SERIES), unit: unitOf(P95), live: { id: 'story', canRefresh: true, auto: true, at: ANSWERED, failed: false } } }
// Auto-refresh off: the chart says which moment it shows
export const Snapshot = { args: { result: parsePromql(PROMQL_ONE_SERIES), unit: unitOf(P95), live: { id: 'story', canRefresh: true, auto: false, at: ANSWERED, failed: false } } }
// The last refresh failed: the chart keeps the data it had
export const RefreshFailed = { args: { result: parsePromql(PROMQL_ONE_SERIES), unit: unitOf(P95), live: { id: 'story', canRefresh: true, auto: true, at: ANSWERED, failed: true } } }
