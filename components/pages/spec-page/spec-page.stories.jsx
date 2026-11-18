import { SpecPage } from './spec-page.jsx'
import { MINI_TRACING, DEPLOYS, SHAPES } from './examples.js'
import { normalizeSpec, inlineOf, queriesOf, SPEC_PARSERS } from '../../../connectors/spec-page.js'
import { parsePromql } from '../../../connectors/dash0/promql.js'
import { parseSpans } from '../../../connectors/dash0/spans.js'
import { OVERVIEW_REQUESTS, OVERVIEW_ERRORS, OVERVIEW_P95, OVERVIEW_BY_SERVICE, OVERVIEW_AT } from '../../../fixtures/dash0-overview.js'
import { DASH0_STORED, NODE_EXPORTER, PERSES_BY_STATUS, PERSES_ALL_GAPS, PERSES_NO_RESULTS } from '../../../fixtures/perses.js'
import { SPEC_ERROR_SPANS } from '../../../fixtures/ditt0-spec-page.js'

const tracing = normalizeSpec(MINI_TRACING).spec
const deploys = normalizeSpec(DEPLOYS).spec
const shapes = normalizeSpec(SHAPES).spec
const checkout = normalizeSpec({ perses: DASH0_STORED }).spec
const nodes = normalizeSpec({ perses: NODE_EXPORTER }).spec

// What each of a page's queries read, as the page asks them at OVERVIEW_AT, from the answer pick gives its PromQL
const answersOf = (spec, pick) => ({
    ...inlineOf(spec),
    ...Object.fromEntries(Object.entries(queriesOf(spec)('1h', OVERVIEW_AT)).map(([key, q]) => [key, SPEC_PARSERS.promql(pick(q.args.query))])),
})

// Every query as the Dash0 MCP answered it, 2026-10-19 (fixtures/dash0-overview.js, fixtures/ditt0-spec-page.js)
const requests = parsePromql(OVERVIEW_REQUESTS)
const errors = parsePromql(OVERVIEW_ERRORS)
const p95 = parsePromql(OVERVIEW_P95)
const data = { 'rate-now': requests, 'errors-now': errors, 'p95-now': p95, rate: requests, errors, p95, spans: parseSpans(SPEC_ERROR_SPANS) }

export default {
    title: 'Features/Ditt0/Pages/Spec Page',
    component: SpecPage,
    actions: ['onRangeChange', 'onAutoChange'],
    argsOnAction: { onRangeChange: (range) => ({ range }), onAutoChange: (auto) => ({ auto }) },
}

// A mini Tracing page, made of blocks: RED stats, charts and the newest error spans, live from Dash0
export const Default = { args: { spec: tracing, data, range: '1h', at: OVERVIEW_AT, auto: true } }

// A mod's own data, nothing asked: no range or Auto-refresh, and the time is when the mod last pushed data
export const Inline = { args: { spec: deploys, data: inlineOf(deploys), at: OVERVIEW_AT, auto: true } }

// Parts of a whole, a timeline and a diagram: pie blocks (round, and squares), a gantt and a Mermaid diagram, inline
export const Shapes = { args: { spec: shapes, data: inlineOf(shapes), at: OVERVIEW_AT, auto: true } }

// A Perses dashboard as Dash0 stores it, drawn from sample answers: its variables heading it, a Markdown note, two stats
// (the p95 had no samples), requests by service, a pie, a table, and the two panels a terminal can't draw
export const Perses = {
    args: {
        spec: checkout,
        range: '6h',
        at: OVERVIEW_AT,
        auto: true,
        data: answersOf(checkout, (query) => /histogram_quantile/.test(query) ? PERSES_ALL_GAPS
            : /ERROR/.test(query) ? OVERVIEW_ERRORS
            : /otel_span_status_code\)/.test(query) ? PERSES_BY_STATUS
            : OVERVIEW_BY_SERVICE),
    },
}

// Perses' node dashboard on a dataset without node-exporter metrics: every panel draws, and says it has no data
export const PersesNoData = { args: { spec: nodes, range: '1h', at: OVERVIEW_AT, auto: true, data: answersOf(nodes, () => PERSES_NO_RESULTS) } }

// Opened, before Dash0 answered
export const Loading = { args: { spec: tracing, data: {}, range: '1h', at: null, auto: true } }

// A query that never answered: its block says so, and the rest draw
export const PanelFailed = { args: { spec: tracing, data: { ...data, spans: null }, range: '1h', at: OVERVIEW_AT, auto: true, failed: ['spans'] } }
