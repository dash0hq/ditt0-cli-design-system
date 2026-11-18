import { DATASET, rangeOf, durationOf, DASH0_PARSERS } from './overview.js'
import { loadPanels } from '../live-page.js'

// The queries behind the Tracing page (components/pages/dash0-tracing), each checked against the Dash0 MCP: Dash0's
// Tracing explorer, its Built-in views › All spans, the third most viewed page of its app. Server spans, over the
// Services overview's ranges (overview.js RANGES), but ending now, as the explorer's do: no settle hold-back, so
// the last step is still filling

const SPANS = '{otel_metric_name="dash0.spans", otel_span_kind="SERVER"}'
const DURATION = '{otel_metric_name="dash0.spans.duration", otel_span_kind="SERVER"}'

// The spans list's filter, as the explorer's link writes it back
const SERVER_ONLY = [{ key: 'otel.span.kind', operator: 'is', value: 'SERVER' }]

// The duration bands of the Outliers heatmap, in seconds, lowest first: a log scale, each about five times the last
export const BANDS = [
    { lo: 0, hi: 0.001 }, { lo: 0.001, hi: 0.005 }, { lo: 0.005, hi: 0.025 }, { lo: 0.025, hi: 0.1 },
    { lo: 0.1, hi: 0.5 }, { lo: 0.5, hi: 2.5 }, { lo: 2.5, hi: 10 }, { lo: 10, hi: Infinity },
]

// The Duration chart's lines, in the order drawn: the first is drawn over the others
export const QUANTILES = [['p99', 0.99], ['p95', 0.95], ['p90', 0.9], ['p75', 0.75], ['p50', 0.5]]

// The span a range draws when it is now: from its first step to the step now is in, both on a step
export const tracingWindowOf = (value, now) => {
    const { ms, step } = rangeOf(value)
    const to = Math.floor(now / step) * step
    return { from: new Date(to - ms + step).toISOString(), to: new Date(to).toISOString() }
}

// Several answers as one, each series marked by a label: one query a panel, however many lines it draws
const marked = (label, parts) => parts.map(([value, query]) => `label_replace(${query}, "${label}", "${value}", "", "")`).join(' or ')

// What each panel asks, as { tool, args } for $.mcp.call. byStatus is the Spans and Errors bars; duration is the
// Duration chart's six lines (the quantiles, and the mean as the histogram's own histogram_avg); bands is the
// Outliers heatmap, 24 series of spans per step (8 bands × 3 statuses: dash0.spans.duration is a native histogram,
// with no le to sum by); extremes its max and p99 over the whole range, at its end. The spans are the newest 15 of
// the range, or of the span picked on a chart (selection: { from, to } in ms)
export const queriesFor = (value, now, { selection = null } = {}) => {
    const range = rangeOf(value)
    const step = durationOf(range.step)
    const window = tracingWindowOf(value, now)
    const promql = (query) => ({ tool: 'promql', args: { query, dataset: DATASET, timeRange: window, timeSeriesOptions: { resolution: step } } })
    const rate = `sum(rate(${DURATION}[${step}]))`
    const counts = `sum by (otel_span_status_code) (increase(${DURATION}[${step}]))`
    const whole = `sum(increase(${DURATION}[${durationOf(range.ms)}]))`
    return {
        byStatus: promql(`sum by (otel_span_status_code) (increase(${SPANS}[${step}]))`),
        duration: promql(marked('q', [...QUANTILES.map(([name, q]) => [name, `histogram_quantile(${q}, ${rate})`]), ['Avg', `histogram_avg(${rate})`]])),
        bands: promql(marked('band', BANDS.map(({ lo, hi }, i) => [i, `histogram_fraction(${lo}, ${hi === Infinity ? '+Inf' : hi}, ${counts}) * histogram_count(${counts})`]))),
        extremes: { tool: 'promql', args: { query: marked('q', [['p99', `histogram_quantile(0.99, ${whole})`], ['max', `histogram_quantile(1, ${whole})`]]), dataset: DATASET, timestamp: window.to } },
        spans: {
            tool: 'getSpans',
            args: {
                dataset: DATASET,
                timeRange: selection ? { from: new Date(selection.from).toISOString(), to: new Date(selection.to).toISOString() } : { from: `now-${durationOf(range.ms)}`, to: 'now' },
                filters: SERVER_ONLY,
                pagination: { limit: 15 },
                spanAttributeKeys: ['dash0.span.type'],
            },
        },
    }
}

// How many panels the page has, for its freshness line
export const PANELS = Object.keys(queriesFor('15m', 0)).length

// The panels a span picked on a chart asks again
export const SELECTS = ['spans']

// The spans of each status per step, as the Spans and Errors charts draw them: ERROR, and OK and UNSET as one;
// null where neither had a sample
export const statusesOf = (read) => {
    const of = (code) => read.series.find(s => s.attributes.otel_span_status_code === code)?.values ?? []
    const error = of('ERROR'), ok = of('OK'), unset = of('UNSET')
    const sum = (a, b) => (a ?? null) === null && (b ?? null) === null ? null : (a ?? 0) + (b ?? 0)
    return { times: read.times, error: read.times.map((_, i) => error[i] ?? null), rest: read.times.map((_, i) => sum(ok[i], unset[i])) }
}

// The Duration chart's lines, in QUANTILES' order and Avg last, whatever order Dash0 answered them in
export const quantilesOf = (read) => {
    const names = [...QUANTILES.map(([name]) => name), 'Avg']
    return { times: read.times, series: names.map(name => ({ name, values: read.series.find(s => s.attributes.q === name)?.values ?? read.times.map(() => null) })) }
}

// The heatmap's cells from the bands answer: error and ok, each [band][step], ok counting OK and UNSET. A missing
// sample counts 0: no spans of that status fell there
export const heatmapOf = (read) => {
    const grid = () => BANDS.map(() => read.times.map(() => 0))
    const error = grid(), ok = grid()
    for (const s of read.series) {
        const band = Number(s.attributes.band)
        if (!(band in BANDS)) continue
        const into = s.attributes.otel_span_status_code === 'ERROR' ? error : ok
        s.values.forEach((v, i) => { into[band][i] += v ?? 0 })
    }
    return { times: read.times, error, ok }
}

// The max and p99 of the range, in seconds; null where Dash0 had none
export const extremesOf = (read) => {
    const of = (q) => read?.series.find(s => s.attributes.q === q)?.values[0] ?? null
    return { max: of('max'), p99: of('p99') }
}

// The Tracing page's panels, read now: { data: { byStatus, duration, bands, extremes, spans }, at, failed }
export async function loadTracing($, server, value, last = {}, selection = null) {
    const now = await $.clock.now()
    return loadPanels($, server, queriesFor(value, now, { selection }), DASH0_PARSERS, last, now)
}
