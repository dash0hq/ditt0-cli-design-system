import { parsePromql } from './promql.js'
import { parseServiceCatalog, parseFailedChecks } from './catalog.js'
import { parseSpans } from './spans.js'
import { loadPanels } from '../live-page.js'

// The queries behind the Services overview page (components/pages/dash0-dashboard), each checked against the Dash0
// MCP, and loading them all at once. Every panel asks Dash0 again on each refresh, the way a Dash0 dashboard does

const MINUTE = 60_000
const HOUR = 60 * MINUTE

// Dash0's own auto-refresh period
export const REFRESH_MS = 30_000
// How long after a step its spans are all in. A step's spans keep arriving for minutes (an api step read 91% of
// its rate 8 minutes after it ended), so a chart ending now dips at the end when nothing dipped. Ranges end this
// long ago, on a step, and every step drawn is whole
export const SETTLE_MS = 10 * MINUTE
// A minute's step is mostly in after two: short ranges hold back less, so a new bar comes every minute
export const settleFor = (step) => step <= MINUTE ? 2 * MINUTE : SETTLE_MS
export const DATASET = 'default'

// A span as PromQL writes it: 5m, 1h
export const durationOf = (ms) => ms % HOUR ? `${ms / MINUTE}m` : `${ms / HOUR}h`

// The ranges offered, each with its step: about a dozen bars, each a whole step
export const RANGES = [
    { value: '15m', label: '15m', ms: 15 * MINUTE, step: MINUTE },
    { value: '1h', label: '1h', ms: HOUR, step: 5 * MINUTE },
    { value: '6h', label: '6h', ms: 6 * HOUR, step: 30 * MINUTE },
    { value: '24h', label: '24h', ms: 24 * HOUR, step: 2 * HOUR },
]
export const rangeOf = (value) => RANGES.find(r => r.value === value) ?? RANGES[1]

const duration = durationOf

// The span a range draws when it is now: from its first step to its last whole one, both on a step
export const windowOf = (value, now) => {
    const { ms, step } = rangeOf(value)
    const to = Math.floor((now - settleFor(step)) / step) * step
    return { from: new Date(to - ms + step).toISOString(), to: new Date(to).toISOString() }
}

const SPANS = '{otel_metric_name="dash0.spans", otel_span_kind="SERVER"}'
const ERRORS = '{otel_metric_name="dash0.spans", otel_span_kind="SERVER", otel_span_status_code="ERROR"}'
const DURATION = '{otel_metric_name="dash0.spans.duration", otel_span_kind="SERVER"}'

// What each panel asks, as { tool, args } for $.mcp.call. Requests are server spans, as Dash0's RED metrics count
// them. The services chart keeps the 8 busiest over the whole range (@ end()), the same 8 at every step: a topk at
// each step would swap services in and out and leave gaps. The tool answers at most 30 series, so the top is
// Dash0's, not ours
export const queriesFor = (value, now) => {
    const range = rangeOf(value)
    const step = duration(range.step)
    const promql = (query) => ({ tool: 'promql', args: { query, dataset: DATASET, timeRange: windowOf(value, now), timeSeriesOptions: { resolution: step } } })
    return {
        requests: promql(`sum(rate(${SPANS}[${step}]))`),
        errors: promql(`100 * sum(rate(${ERRORS}[${step}])) / sum(rate(${SPANS}[${step}]))`),
        p95: promql(`histogram_quantile(0.95, sum by (le) (rate(${DURATION}[${step}])))`),
        byService: promql(`sum by (service_name) (rate(${SPANS}[${step}])) and on (service_name) topk(8, sum by (service_name) (rate(${SPANS}[${duration(range.ms)}] @ end())))`),
        byStatus: promql(`sum by (otel_span_status_code) (increase(${SPANS}[${step}]))`),
        services: {
            tool: 'getServiceCatalog',
            args: {
                dataset: DATASET,
                timeRange: { from: `now-${value}`, to: 'now' },
                sort: { by: 'requests_total', order: 'descending' },
                pagination: { limit: 10 },
                filters: [{ key: 'dash0.resource.type', operator: 'is_not', value: 'external' }],
            },
        },
        // Failing now, whatever the range: a check that failed earlier and ended isn't one to look at
        checks: {
            tool: 'getFailedChecks',
            args: {
                dataset: DATASET,
                timeRange: { from: 'now-1h', to: 'now' },
                pagination: { limit: 50 },
                filters: [{ key: 'dash0.failed_check.status', operator: 'is_one_of', value: ['critical', 'degraded'] }],
            },
        },
    }
}

// How each Dash0 MCP tool's answer is read into a panel's data, for a live page's parsers (connectors/live-page.js)
export const DASH0_PARSERS = { promql: parsePromql, getServiceCatalog: parseServiceCatalog, getFailedChecks: parseFailedChecks, getSpans: parseSpans }

// The Services overview's panels, read now: { data: { requests, errors, p95, byService, byStatus, services, checks }, at, failed }
export async function loadOverview($, server, value, last = {}) {
    const now = await $.clock.now()
    return loadPanels($, server, queriesFor(value, now), DASH0_PARSERS, last, now)
}
