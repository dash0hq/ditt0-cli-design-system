import { Dash0Tracing } from './dash0-tracing.jsx'
import { parsePromql } from '../../../connectors/dash0/promql.js'
import { parseSpans } from '../../../connectors/dash0/spans.js'
import {
    TRACING_BY_STATUS, TRACING_DURATION, TRACING_BANDS, TRACING_EXTREMES, TRACING_SPANS, TRACING_SPANS_PICKED, TRACING_AT,
} from '../../../fixtures/dash0-tracing.js'

// Every panel as the Dash0 MCP answered it, 2026-10-19 (fixtures/dash0-tracing.js)
const spans = parseSpans(TRACING_SPANS)
const data = {
    byStatus: parsePromql(TRACING_BY_STATUS),
    duration: parsePromql(TRACING_DURATION),
    bands: parsePromql(TRACING_BANDS),
    extremes: parsePromql(TRACING_EXTREMES),
    spans,
}
// Every listed span was UNSET: one marked ERROR, so a failed span shows how it reads
const marked = { ...data, spans: { ...spans, spans: spans.spans.map((s, i) => i === 1 ? { ...s, status: 'ERROR' } : s) } }

export default {
    title: 'Features/Dash0/Pages/Tracing',
    component: Dash0Tracing,
    actions: ['onRangeChange', 'onAutoChange', 'onViewChange', 'onSelectionChange'],
    argsOnAction: {
        onRangeChange: (range) => ({ range }),
        onAutoChange: (auto) => ({ auto }),
        onViewChange: (view) => ({ view }),
        onSelectionChange: (selection) => ({ selection }),
    },
}

export const Default = { args: { data: marked, range: '15m', at: TRACING_AT, auto: true, view: 'red' } }

export const Loading = { args: { data: {}, range: '15m', at: null, auto: true, view: 'red' } }

export const OutliersView = { args: { data, range: '15m', at: TRACING_AT, auto: true, view: 'outliers' } }

export const NoneView = { args: { data, range: '15m', at: TRACING_AT, auto: true, view: 'none' } }

// 16:03–16:05 dragged across the Duration chart: the list shows that span's newest spans
export const Picked = {
    args: {
        data: { ...data, spans: parseSpans(TRACING_SPANS_PICKED) },
        range: '15m', at: TRACING_AT, auto: true, view: 'red',
        selection: { from: Date.parse('2026-10-19T16:02:00.000Z'), to: Date.parse('2026-10-19T16:05:00.000Z') },
    },
}

export const RefreshFailed = { args: { data, range: '15m', at: TRACING_AT, auto: true, view: 'red', failed: ['duration', 'spans'] } }
