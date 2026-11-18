// Example Ditt0Page specs (types/index.d.ts): plain JSON, as another mod passes to $.ditt0.open or Claude to the
// ditt0_show tool. The stories, the tests and the docs draw these

const SPANS = '{otel_metric_name="dash0.spans", otel_span_kind="SERVER"}'
const ERRORS = '{otel_metric_name="dash0.spans", otel_span_kind="SERVER", otel_span_status_code="ERROR"}'
const DURATION = '{otel_metric_name="dash0.spans.duration", otel_span_kind="SERVER"}'

// A mini Tracing page from blocks: RED stats, the rate and error charts side by side, p95, and the newest error spans
export const MINI_TRACING = {
    id: 'mini-tracing',
    title: 'Mini tracing',
    range: '1h',
    blocks: [
        { type: 'tags', tags: [{ label: 'otel.span.kind', value: 'SERVER' }] },
        { type: 'stats', items: [
            { id: 'rate-now', label: 'Span rate', unit: '/s', promql: `sum(rate(${SPANS}[$step]))` },
            { id: 'errors-now', label: 'Error rate', unit: 'percent', goodWhen: 'down', promql: `100 * sum(rate(${ERRORS}[$step])) / sum(rate(${SPANS}[$step]))` },
            { id: 'p95-now', label: 'P95', unit: 'seconds', goodWhen: 'down', promql: `histogram_quantile(0.95, sum by (le) (rate(${DURATION}[$step])))` },
        ] },
        { type: 'row', blocks: [
            { type: 'timeseries', id: 'rate', title: 'Requests', unit: '/s', lineType: 'bars', promql: `sum(rate(${SPANS}[$step]))` },
            { type: 'timeseries', id: 'errors', title: 'Errors', unit: 'percent', promql: `100 * sum(rate(${ERRORS}[$step])) / sum(rate(${SPANS}[$step]))` },
        ] },
        { type: 'timeseries', id: 'p95', title: 'Duration', subtitle: 'p95', unit: 'seconds', promql: `histogram_quantile(0.95, sum by (le) (rate(${DURATION}[$step])))` },
        { type: 'table', id: 'spans', title: 'Error spans', spans: { filters: [{ key: 'otel.span.kind', operator: 'is', value: 'SERVER' }, { key: 'otel.span.status.code', operator: 'is', value: 'ERROR' }], limit: 5 } },
        { type: 'link' },
    ],
}

// A page with nothing to ask: every block carries its data, which the mod pushes again with $.ditt0.update
export const DEPLOYS = {
    id: 'deploys',
    title: 'Deploys',
    blocks: [
        { type: 'text', text: 'Deploys to production this week, from the release tool', color: 'subtle' },
        { type: 'stats', items: [
            { id: 'count', label: 'Deploys', value: 23 },
            { id: 'lead', label: 'Lead time', unit: 'seconds', goodWhen: 'down', values: [5400, 4800, 5100, 3900, 3600] },
        ] },
        { type: 'bars', id: 'by-day', title: 'Deploys by day', alt: 'Deploys to production by weekday', bars: [
            { label: 'Mon', value: 4 }, { label: 'Tue', value: 6 }, { label: 'Wed', value: 5 }, { label: 'Thu', value: 7 }, { label: 'Fri', value: 1 },
        ] },
        { type: 'table', id: 'recent', title: 'Latest', columns: [{ key: 'service', label: 'Service' }, { key: 'version', label: 'Version' }, { key: 'state', label: 'State' }], rows: [
            { service: 'checkout', version: 'v2.14.0', state: { text: 'LIVE', badge: 'success' } },
            { service: 'cart', version: 'v1.9.3', state: { text: 'ROLLED BACK', badge: 'critical' } },
        ] },
    ],
}

// Parts of a whole, a timeline and a diagram, all inline: spans by status as a pie, a deploy's steps as a gantt, and
// the request path it changed as a diagram
export const SHAPES = {
    id: 'shapes',
    title: 'Checkout deploy',
    blocks: [
        { type: 'row', blocks: [
            { type: 'pie', id: 'status', title: 'Spans by status', unit: 'spans', slices: [{ label: 'OK', value: 588000 }, { label: 'ERROR', value: 30800 }, { label: 'UNSET', value: 120400 }] },
            { type: 'pie', id: 'kind', title: 'Spans by kind', variant: 'squares', slices: [{ label: 'SERVER', value: 61 }, { label: 'CLIENT', value: 27 }, { label: 'INTERNAL', value: 12 }] },
        ] },
        { type: 'gantt', id: 'steps', title: 'Deploy steps', tasks: [
            { label: 'Build', start: '2026-10-21T13:00:00Z', end: '2026-10-21T13:06:00Z' },
            { label: 'Canary', start: '2026-10-21T13:06:00Z', end: '2026-10-21T13:21:00Z' },
            { label: 'Roll out', start: '2026-10-21T13:21:00Z', end: '2026-10-21T13:34:00Z' },
            { label: 'Live', start: '2026-10-21T13:34:00Z', milestone: true },
        ] },
        { type: 'diagram', title: 'Request path', source: 'flowchart LR\n    client[Client] --> api[api] --> checkout[checkout] --> pg[(Postgres)]' },
    ],
}
