import { el } from '../../elements.js'
import { Link } from '../../atoms/link/link.jsx'
import { Button } from '../../atoms/button/button.jsx'
import { Switch } from '../../atoms/switch/switch.jsx'
import { Select } from '../../atoms/select/select.jsx'
import { Tag } from '../../atoms/tag/tag.jsx'
import { Text } from '../../atoms/text/text.jsx'
import { Tabs } from '../../molecules/tabs/tabs.jsx'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { Heatmap } from '../../molecules/charts/heatmap/heatmap.jsx'
import { Table } from '../../molecules/table/table.jsx'
import { Freshness, panel } from '../live-parts.jsx'
import { ChartGrid } from '../../templates/chart-grid/chart-grid.jsx'
import { status } from '../../foundations/tokens/tokens.js'
import { zoneOf } from '../../../connectors/dash0/promql.js'
import { RANGES, rangeOf } from '../../../connectors/dash0/overview.js'
import { PANELS, BANDS, tracingWindowOf, statusesOf, quantilesOf, heatmapOf, extremesOf } from '../../../connectors/dash0/tracing.js'

// The ranges as the explorer's time picker writes them
const RANGE_LABELS = { '15m': 'Last 15 minutes', '1h': 'Last 1 hour', '6h': 'Last 6 hours', '24h': 'Last 24 hours' }
// The chart views over the spans, as the explorer offers them
const VIEWS = [{ value: 'outliers', label: 'Outliers' }, { value: 'red', label: 'RED' }, { value: 'none', label: 'None' }]

const pad = (n, width = 2) => String(n).padStart(width, '0')
// A moment on the person's clock, to the millisecond: 16:10:35.457
const clockMs = (ms) => {
    const d = new Date(ms)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}
const clockS = (ms) => clockMs(ms).slice(0, 8)
// A span's duration as the explorer's list writes it: whole milliseconds, with a thousands separator; '< 1ms' under
export const durationText = (seconds) => seconds < 0.001 ? '< 1ms' : `${Math.round(seconds * 1000).toLocaleString('en-US')}ms`

// The newest spans as table rows. Every value is what the application wrote; an ERROR span's name is in the error red
const spanRows = (spans) => spans.map(s => ({
    name: s.status === 'ERROR' ? { text: s.name, color: status('error').inline } : s.name,
    service: s.service,
    start: clockMs(s.start),
    duration: durationText(s.duration),
    root: s.root ? { text: 'ROOT', badge: 'default' } : '',
    type: s.type ? s.type.toUpperCase() : '',
    kind: { text: 'SERVER', badge: 'default' },
}))
const SPAN_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'service', label: 'Service' },
    { key: 'start', label: 'Start Time' },
    { key: 'duration', label: 'Duration', align: 'right' },
    { key: 'root', label: 'Root' },
    { key: 'type', label: 'Type' },
    { key: 'kind', label: 'Kind' },
]

// A chart in a card, its title bright and what it counts dim beside it, as the explorer heads its charts. A
// ChartGrid lays the cards side by side, as many as fit a chart's width (CHART_MAX) each
function Card({ title, unit, children }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
            <ui.Box flexDirection="row" columnGap={1}>
                <Text color="intense">{title}</Text>
                {unit ? <Text color="subtle">{unit}</Text> : null}
            </ui.Box>
            {children}
        </ui.Box>
    )
}

const ERROR = { otel_span_status_code: 'ERROR' }
const REST = { otel_span_status_code: 'UNSET' }

// Dash0's Tracing explorer, Built-in views › All spans, live: the server spans of every service over a range ending
// now (connectors/dash0/tracing.js). A chart of them in one of three views, then the newest spans themselves.
// - red (the default): Spans (ERROR beside OK & UNSET, a count a step), Errors and Duration (p99 to p50 and Avg).
//   Dragging across Errors or Duration picks that span of time: the spans list asks for it, under a Timerange tag
// - outliers: the spans as a Heatmap, by duration band and status; none: no chart
// data: what loadTracing read, { byStatus, duration, bands, extremes, spans }, each null until it came; view: the
// view shown; selection: the span picked, { from, to } in ms, or null for the range; range, at, auto, failed,
// refreshing, onRangeChange, onAutoChange, onClose: as the Services overview's (dash0-dashboard.jsx);
// onViewChange(view); onSelectionChange({ from, to } or null)
export function Dash0Tracing({ data = {}, range = '15m', at = null, auto = true, failed = [], refreshing = false, view = 'red', selection = null, onRangeChange, onAutoChange, onViewChange, onSelectionChange, onClose }) {
    const ui = el()
    const zone = at ? zoneOf(at) : undefined
    // A drag across a chart's steps, first to last: from the start of the first to the end of the last. A step's
    // sample counts the spans of the step that ends on it
    const pick = ({ start, end }) => {
        if (!at || !onSelectionChange) return
        const { step } = rangeOf(range)
        const first = Date.parse(tracingWindowOf(range, at).from)
        onSelectionChange({ from: first + (start - 1) * step, to: first + end * step })
    }
    const statuses = data.byStatus ? statusesOf(data.byStatus) : null
    const red = () => (
        <ChartGrid id="tracing-red">
            <Card title="Spans" unit="Count">
                {panel(statuses, failed.includes('byStatus'), 'span counts', (read) => (
                    <Timeseries series={[{ name: 'ERROR', attributes: ERROR, values: read.error }, { name: 'OK & UNSET', attributes: REST, values: read.rest }]} times={read.times} lineType="bars" stacked timeLabel={zone} controls={false} />
                ))}
            </Card>
            <Card title="Errors" unit="Count">
                {panel(statuses, failed.includes('byStatus'), 'errors', (read) => (
                    <Timeseries series={[{ name: 'ERROR', attributes: ERROR, values: read.error }]} times={read.times} lineType="bars" timeLabel={zone} controls={false} onZoom={pick} />
                ))}
            </Card>
            <Card title="Duration">
                {panel(data.duration && quantilesOf(data.duration), failed.includes('duration'), 'durations', (read) => (
                    <Timeseries series={read.series} times={read.times} unit="seconds" timeLabel={zone} multiples={false} controls={false} onZoom={pick} />
                ))}
            </Card>
        </ChartGrid>
    )
    const outliers = () => (
        <Card title="Outliers">
            {panel(data.bands && heatmapOf(data.bands), failed.includes('bands'), 'outliers', (read) => (
                <Heatmap times={read.times} bands={BANDS} ok={read.ok} error={read.error} {...extremesOf(data.extremes)} />
            ))}
        </Card>
    )
    return (
        <ui.Box flexDirection="column" gap={1}>
            <ui.Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" alignItems="center" columnGap={2}>
                <ui.Box flexDirection="row" columnGap={1}>
                    <ui.Text dimColor>Built-in views ›</ui.Text>
                    <ui.Text bold>All spans</ui.Text>
                </ui.Box>
                <ui.Box flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={2}>
                    <Select id="tracing-range" label="Time range" options={RANGES.map(r => ({ value: r.value, label: RANGE_LABELS[r.value] ?? r.label }))} value={range} onValueChange={onRangeChange} />
                    <Switch id="tracing-auto-refresh" label="Auto" checked={auto} onCheckedChange={onAutoChange} />
                    {data.spans?.link ? <Link href={data.spans.link} label="Open in Dash0" variant="cta" /> : null}
                </ui.Box>
            </ui.Box>
            <Freshness at={at} auto={auto} failed={failed} panels={PANELS} refreshing={refreshing} />
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={2}>
                <Tag label="otel.span.kind" value="SERVER" />
                <ui.Text dimColor>Group by None</ui.Text>
            </ui.Box>
            <ui.Box flexDirection="column">
                <ui.Box flexDirection="row" columnGap={3}>
                    <ui.Text bold>Chart</ui.Text>
                    <Tabs tabs={VIEWS} value={view} onChange={onViewChange} />
                </ui.Box>
                {view === 'red' ? red() : view === 'outliers' ? outliers() : null}
            </ui.Box>
            <ui.Box flexDirection="column" gap={1}>
                <ui.Box flexDirection="row" columnGap={3}>
                    <ui.Text bold>Spans</ui.Text>
                    <ui.Text dimColor>Table</ui.Text>
                </ui.Box>
                {selection ? (
                    <ui.Box flexDirection="row">
                        <Tag id="timerange" label="Timerange" value={`${clockS(selection.from)} – ${clockS(selection.to)}`} onRemove={() => onSelectionChange?.(null)} />
                    </ui.Box>
                ) : null}
                {panel(data.spans, failed.includes('spans'), 'spans', (read) => read.spans.length
                    ? <Table columns={SPAN_COLUMNS} rows={spanRows(read.spans)} />
                    : <ui.Text dimColor>No server spans in this time range.</ui.Text>)}
            </ui.Box>
            {onClose ? <ui.Box flexDirection="row"><Button id="close" label="Close" variant="transparent" onClick={onClose} /></ui.Box> : null}
        </ui.Box>
    )
}
