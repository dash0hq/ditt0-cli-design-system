import { Timeseries } from './timeseries.js'
import { times, apiLatency, requestRates } from '../../../../fixtures/dash0.js'
import { times24h, requestRates24h } from '../../../../fixtures/dash0-24h.js'
import { spanTimes, spansByStatus } from '../../../../fixtures/dash0-span-status.js'
import { memoryTimes, memoryByService } from '../../../../fixtures/dash0-memory.js'

export default { title: 'Components/Charts/Timeseries', component: Timeseries }

export const Default = { args: { series: apiLatency, times, unit: 'ms' } }
// The same latencies in braille dots: one thin line, a quarter row fine
export const Dots = { args: { series: apiLatency, times, unit: 'ms', lineType: 'braille' } }
export const SmallMultiples = { args: { series: requestRates, times, unit: '/s' } }
export const Gaps = { args: { series: requestRates24h.filter(s => ['staff', 'image-resizer-api'].includes(s.name)), times: times24h, unit: '/s' } }
// Series whose attributes carry meaning take its colour: ERROR is the error red wherever it sits
export const SpanStatus = { args: { series: spansByStatus, times: spanTimes } }

// Two services of a few requests per second, from fixtures/dash0-24h.js: on one axis, their lines cross
// dozens of times. A line of braille dots through every sample; where the lines meet, ui, listed first, keeps the cell
const CROSSING = requestRates24h.filter(s => ['ui', 'mail-sink'].includes(s.name))
export const Crossing = { args: { series: CROSSING, times: times24h, unit: '/s', lineType: 'braille' } }
// The same lines in box-drawing glyphs, a row at a time: ui drawn over mail-sink, which breaks where it passes under
export const BoxLines = { args: { series: CROSSING, times: times24h, unit: '/s', lineType: 'box' } }
// Box-drawing, both strokes merged into one glyph where they cross, in neither colour
export const BoxMerged = { args: { series: CROSSING, times: times24h, unit: '/s', lineType: 'box', overlap: 'merge' } }

// Bars: a bar a column, from zero, in eighths of a row. The 24 hours of api requests, folded into the columns there are
export const Bars = { args: { series: requestRates24h.filter(s => s.name === 'api'), times: times24h, unit: '/s', lineType: 'bars' } }
// Several series as bars are grouped: memory by service, a bar per service in each window, side by side
export const BarsGrouped = { args: { series: memoryByService, times: memoryTimes, unit: 'bytes', lineType: 'bars' } }
// stacked: one bar a time, the series one on another, for series that add up, such as spans by status
export const BarsStacked = { args: { series: spansByStatus, times: spanTimes, lineType: 'bars', stacked: true } }

// A unit that scales: memory in bytes reads in GB, on the axis and in the cards
export const Bytes = { args: { series: memoryByService, times: memoryTimes, unit: 'bytes', timeLabel: 'UTC' } }
// The same latency as Default, in seconds: under a second, it reads in ms
export const Seconds = { args: { series: apiLatency.map(s => ({ ...s, values: s.values.map(v => v === null ? null : v / 1000) })), times, unit: 'seconds' } }
// No legend, for a chart whose series are named around it
export const NoLegend = { args: { series: CROSSING, times: times24h, unit: '/s', legend: false } }
