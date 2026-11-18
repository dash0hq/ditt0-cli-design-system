import { BarChart } from './bar-chart.js'
import { times, apiLatency } from '../../../../fixtures/dash0.js'
import { times24h, requestRates24h } from '../../../../fixtures/dash0-24h.js'
import { spanTimes, spansByStatus } from '../../../../fixtures/dash0-span-status.js'

export default { title: 'Components/Charts/BarChart', component: BarChart }

// p99 latency of api's server spans, by hour, 2026-10-17 (UTC): short labels in order, so columns
export const Default = {
    args: {
        bars: [
            { label: '03:00', value: 291 },
            { label: '04:00', value: 399 },
            { label: '05:00', value: 547 },
            { label: '06:00', value: 300 },
            { label: '07:00', value: 256 },
        ],
        unit: 'ms',
        alt: 'p99 latency by hour: 03:00 291 ms, 04:00 399 ms, 05:00 547 ms, 06:00 300 ms, 07:00 256 ms',
    },
}

// Long service names, ranked largest first, so rows
export const Horizontal = {
    args: {
        orientation: 'horizontal',
        bars: [
            { label: 'api', value: 486 },
            { label: 'fulfillment-queue-worker', value: 62 },
            { label: 'order-history-api', value: 31 },
        ],
        unit: '/s',
        alt: 'Requests per second: api 486, fulfillment-queue-worker 62, order-history-api 31',
    },
}

// p95 beside p99 of api's server spans, from fixtures/dash0.js: two bars at each time, to compare them
export const Grouped = {
    args: {
        labels: ['03:35', '04:05', '04:15', '04:25', '04:35'],
        series: [
            { name: 'p95', values: [109, 130, 120, 106, 108] },
            { name: 'p99', values: [291, 399, 547, 282, 301] },
        ],
        unit: 'ms',
        alt: 'p95 and p99 latency: 03:35 109 and 291 ms, 04:05 130 and 399 ms, 04:15 120 and 547 ms, 04:25 106 and 282 ms, 04:35 108 and 301 ms',
    },
}

// Requests per second by service, from fixtures/dash0.js: the services add up to the total, so they stack
export const Stacked = {
    args: {
        grouping: 'stacked',
        labels: ['03:35', '04:35', '05:35', '06:35', '07:30'],
        series: [
            { name: 'api', values: [1116, 1126, 1125, 1124, 1110] },
            { name: 'fulfillment-queue-worker', values: [144, 144, 144, 144, 62] },
            { name: 'order-history-api', values: [67, 86, 71, 69, 69] },
        ],
        unit: '/s',
        alt: 'Requests per second by service: 03:35 api 1116, fulfillment-queue-worker 144, order-history-api 67; 04:35 1126, 144, 86; 05:35 1125, 144, 71; 06:35 1124, 144, 69; 07:30 1110, 62, 69',
    },
}

// The stories below are worked out from the fixtures, so every value is one Dash0 returned: a window's mean,
// rounded as a card shows it, or null where the window has no samples
const meanOf = (values, from, to) => {
    const known = values.slice(from, to).filter(v => v !== null)
    if (!known.length) return null
    const mean = known.reduce((a, v) => a + v, 0) / known.length
    return Number(mean.toPrecision(mean >= 10 ? 3 : 2))
}
// Windows of n samples, labelled by the first sample's time
const windows = (labels, n) => labels.flatMap((label, i) => i % n === 0 ? [{ label, from: i, to: i + n }] : [])
const service = (name) => requestRates24h.find(s => s.name === name)
const said = (labels, series, unit) => labels.map((label, i) => `${label} ${series.map(s => `${s.name} ${s.values[i] ?? 'no data'}`).join(', ')}`).join('; ') + ` (${unit})`

// p50, p95 and p99 of api's server spans, by hour, from fixtures/dash0.js: three series a group, p50 too small to
// see beside p99, so its bar is a sliver and its card carries the value
const hours = windows(times, 12)
const quantiles = apiLatency.map(s => ({ name: s.name, values: hours.map(w => meanOf(s.values, w.from, w.to)) }))
export const GroupedQuantiles = {
    args: {
        labels: hours.map(w => w.label),
        series: quantiles,
        unit: 'ms',
        alt: `api latency by quantile and hour: ${said(hours.map(w => w.label), quantiles, 'ms')}`,
    },
}

// Five services' requests per second, by 4-hour window over 24 hours, from fixtures/dash0-24h.js: 30 bars in six
// groups, so the columns narrow to fit and the legend wraps
const FIVE = ['fulfillment-queue-worker', 'order-history-api', 'gcp-warehouse-sync-tasks-worker', 'aws-warehouse-sync-tasks-worker', 'search']
const quarters = windows(times24h, 48)
const fiveRates = FIVE.map(name => ({ name, values: quarters.map(w => meanOf(service(name).values, w.from, w.to)) }))
export const GroupedManySeries = {
    args: {
        labels: quarters.map(w => w.label),
        series: fiveRates,
        unit: '/s',
        alt: `Requests per second by service, every 4 hours: ${said(quarters.map(w => w.label), fiveRates, '/s')}`,
    },
}

// The same five services, compared at the first and the last 4 hours of the day: horizontal, so the long service
// names fit, each a label with two bars, one per window
const ends = [quarters[0], quarters[quarters.length - 1]]
const spanName = (w) => `${w.label}–${times24h[Math.min(w.to, times24h.length - 1)]}`
const byService = ends.map(w => ({ name: spanName(w), values: FIVE.map(name => meanOf(service(name).values, w.from, w.to)) }))
export const GroupedHorizontal = {
    args: {
        orientation: 'horizontal',
        labels: FIVE,
        series: byService,
        unit: '/s',
        alt: `Requests per second by service, ${spanName(ends[0])} beside ${spanName(ends[1])}: ${said(FIVE, byService, '/s')}`,
    },
}

// Six services stacked, every 4 hours: more segments than textures, so the fifth and sixth wear the first ones
// again, and their colours tell them apart
const SIX = ['api', ...FIVE]
const sixRates = SIX.map(name => ({ name, values: quarters.map(w => meanOf(service(name).values, w.from, w.to)) }))
export const StackedManySeries = {
    args: {
        grouping: 'stacked',
        labels: quarters.map(w => w.label),
        series: sixRates,
        unit: '/s',
        alt: `Requests per second by service, stacked, every 4 hours: ${said(quarters.map(w => w.label), sixRates, '/s')}`,
    },
}

// api's errored spans under its OK ones, per 5 minutes, averaged over 40-minute spells, from
// fixtures/dash0-span-status.js, stacked and horizontal: the span status attribute colours ERROR red
const spells = windows(spanTimes, 8)
const statuses = spansByStatus.filter(s => s.name !== 'UNSET').map(s => ({ ...s, values: spells.map(w => meanOf(s.values, w.from, w.to)) }))
export const StackedStatus = {
    args: {
        orientation: 'horizontal',
        grouping: 'stacked',
        labels: spells.map(w => w.label),
        series: statuses,
        alt: `api spans per 5 minutes by status, every 40 minutes: ${said(spells.map(w => w.label), statuses, 'spans')}`,
    },
}

// Two services that stopped reporting for part of the day, from fixtures/dash0-24h.js: a window with no samples is
// no bar and says "no data", never a zero
const GAPPY = ['staff', 'image-resizer-api']
const gappy = GAPPY.map(name => ({ name, values: quarters.map(w => meanOf(service(name).values, w.from, w.to)) }))
export const GroupedGaps = {
    args: {
        labels: quarters.map(w => w.label),
        series: gappy,
        unit: '/s',
        alt: `Requests per second, staff and image-resizer-api, every 4 hours: ${said(quarters.map(w => w.label), gappy, '/s')}`,
    },
}
