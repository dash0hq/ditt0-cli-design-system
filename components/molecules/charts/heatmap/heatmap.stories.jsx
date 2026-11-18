import { Heatmap } from './heatmap.jsx'
import { parsePromql } from '../../../../connectors/dash0/promql.js'
import { BANDS, heatmapOf, extremesOf } from '../../../../connectors/dash0/tracing.js'
import { TRACING_BANDS, TRACING_EXTREMES } from '../../../../fixtures/dash0-tracing.js'

// Dash0's server spans of 15:56–16:10 UTC, 2026-10-19, by duration band and status (fixtures/dash0-tracing.js)
const cells = heatmapOf(parsePromql(TRACING_BANDS))
const extremes = extremesOf(parsePromql(TRACING_EXTREMES))

export default { title: 'Components/Charts/Heatmap', component: Heatmap }

export const Default = { args: { times: cells.times, bands: BANDS, ok: cells.ok, error: cells.error, ...extremes } }

// A quiet range: no spans, so every cell is empty and the scale tops at 0
export const Empty = { args: { times: cells.times, bands: BANDS, ok: BANDS.map(() => cells.times.map(() => 0)), error: BANDS.map(() => cells.times.map(() => 0)), max: null, p99: null } }
