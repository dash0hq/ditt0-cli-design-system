import { ChartCard } from './chart-card.jsx'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { BarChart } from '../../molecules/charts/bar-chart/bar-chart.js'
import { times24h, requestRates24h } from '../../../fixtures/dash0-24h.js'

// Pressing a range or a line type, or zooming, sets the story's args, so the card follows, as a page keeping them
// would. A new range drops the zoom; Reset zoom drops it too
export default {
    title: 'Components/Charts/ChartCard',
    component: ChartCard,
    actions: ['onRangeChange', 'onLineTypeChange', 'onOrientationChange', 'onZoom', 'onZoomReset'],
    argsOnAction: {
        onRangeChange: (range) => ({ range, zoom: undefined }),
        onLineTypeChange: 'lineType',
        onOrientationChange: 'orientation',
        onZoom: ({ from, to }) => ({ zoom: { from, to } }),
        onZoomReset: () => ({ zoom: undefined }),
    },
}

// The fixture's samples are 5 minutes apart: a range keeps its last hour, 6 hours, or all 24, as a new query would
const SAMPLES = { '1h': 12, '6h': 72, '24h': 288 }
const lastOf = (range, values) => values.slice(-SAMPLES[range])
// The zoomed span of a range, as indices into its samples: the times the chart reported, or all of them
const spanOf = (args) => {
    const times = lastOf(args.range, times24h)
    const start = args.zoom ? times.indexOf(args.zoom.from) : -1
    const end = args.zoom ? times.indexOf(args.zoom.to) : -1
    return start >= 0 && end > start ? [start, end] : [0, times.length - 1]
}
// A range's samples in the zoomed span, as a page querying that span would get
const zoomed = (args, values) => {
    const [start, end] = spanOf(args)
    return lastOf(args.range, values).slice(start, end + 1)
}
// The sample under the pointer, by index into the range's samples, as the chart last reported it; null when the
// pointer is off the chart. Kept outside the args: it changes on every move and redraws nothing
let pointer = null
const onHover = (args, hovered) => {
    const [start] = spanOf(args)
    pointer = hovered ? start + Math.round((hovered.start + hovered.end) / 2) : null
}
// Zooming as a map does: the sample under the pointer stays where it is, and the span around it halves (+) or
// doubles (−); with no pointer, around the middle. − reaching the whole range ends the zoom
const zoomBy = (args, factor) => {
    const [start, end] = spanOf(args)
    const times = lastOf(args.range, times24h)
    const anchor = pointer !== null && pointer >= start && pointer <= end ? pointer : (start + end) / 2
    const length = Math.max(2, Math.round((end - start) * factor))
    if (length >= times.length - 1) return args.onZoomReset()
    let from = Math.round(anchor - (anchor - start) * factor)
    from = Math.max(0, Math.min(times.length - 1 - length, from))
    if (from === start && from + length === end) return
    args.onZoom({ from: times[from], to: times[from + length] })
}
const zoomIn = (args) => zoomBy(args, 0.5)
const zoomOut = (args) => zoomBy(args, 2)
const SERVICES = ['fulfillment-queue-worker', 'order-history-api', 'gcp-warehouse-sync-tasks-worker']

// Request rates of three services, from fixtures/dash0-24h.js: 24 hours, or the last 1 or 6 of them.
// Drag across the plot to zoom in; or point at a moment and press i or o to zoom in or out around it
export const Default = {
    args: {
        title: 'Requests per second',
        subtitle: 'sum by (service_name) (rate(dash0_spans_total[5m]))',
        range: '24h',
        lineType: 'box',
        addZoomControl: true,
    },
    render: (args) => (
        <ChartCard
            {...args}
            zoom={args.zoom ? `${args.zoom.from}–${args.zoom.to}` : undefined}
            onZoomIn={() => zoomIn(args)}
            onZoomOut={() => zoomOut(args)}
        >
            <Timeseries
                lineType={args.lineType}
                series={requestRates24h.filter(s => SERVICES.includes(s.name)).map(s => ({ ...s, values: zoomed(args, s.values) }))}
                times={zoomed(args, times24h)}
                unit="/s"
                onZoom={args.onZoom}
                onHover={(hovered) => onHover(args, hovered)}
                onZoomIn={() => zoomIn(args)}
                onZoomOut={() => zoomOut(args)}
                onZoomReset={args.onZoomReset}
            />
        </ChartCard>
    ),
}

// p99 latency of api's server spans, by hour, 2026-10-17 (UTC): a bar chart in the same card, with a Vertical /
// Horizontal switch in place of Dots / Lines, and no zoom
export const BarChartCard = {
    args: { title: 'p99 latency by hour', subtitle: 'api, server spans', range: '6h', orientation: 'vertical' },
    render: (args) => (
        <ChartCard {...args}>
            <BarChart
                orientation={args.orientation}
                bars={[
                    { label: '03:00', value: 291 },
                    { label: '04:00', value: 399 },
                    { label: '05:00', value: 547 },
                    { label: '06:00', value: 300 },
                    { label: '07:00', value: 256 },
                ]}
                unit="ms"
                alt="p99 latency by hour: 03:00 291 ms, 04:00 399 ms, 05:00 547 ms, 06:00 300 ms, 07:00 256 ms"
            />
        </ChartCard>
    ),
}

// A card for a span of time that can't change, such as a past incident: no range buttons
export const NoRanges = {
    args: { title: 'Requests per second during the 05:00 incident', ranges: [] },
    render: (args) => (
        <ChartCard {...args}>
            <BarChart
                orientation="horizontal"
                bars={[
                    { label: 'api', value: 486 },
                    { label: 'fulfillment-queue-worker', value: 62 },
                    { label: 'order-history-api', value: 31 },
                ]}
                unit="/s"
                alt="Requests per second: api 486, fulfillment-queue-worker 62, order-history-api 31"
            />
        </ChartCard>
    ),
}
