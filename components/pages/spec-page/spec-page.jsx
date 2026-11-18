import { el, inScope } from '../../elements.js'
import { Heading } from '../../atoms/heading/heading.jsx'
import { Text } from '../../atoms/text/text.jsx'
import { Badge } from '../../atoms/badge/badge.jsx'
import { Tag } from '../../atoms/tag/tag.jsx'
import { Link } from '../../atoms/link/link.jsx'
import { Button } from '../../atoms/button/button.jsx'
import { Select } from '../../atoms/select/select.jsx'
import { Switch } from '../../atoms/switch/switch.jsx'
import { Stat } from '../../molecules/charts/stat/stat.jsx'
import { Gauge } from '../../molecules/charts/gauge/gauge.jsx'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { BarChart } from '../../molecules/charts/bar-chart/bar-chart.js'
import { Table } from '../../molecules/table/table.jsx'
import { PieChart } from '../../molecules/charts/pie-chart/pie-chart.jsx'
import { SquareChart } from '../../molecules/charts/square-chart/square-chart.jsx'
import { GanttChart } from '../../molecules/charts/gantt-chart/gantt-chart.jsx'
import { FlowDiagram } from '../../molecules/flow-diagram/flow-diagram.jsx'
import { Freshness, panel, statOf } from '../live-parts.jsx'
import { status } from '../../foundations/tokens/tokens.js'
import { formatValue } from '../../foundations/units/units.js'
import { clockTime, zoneOf } from '../../../connectors/dash0/promql.js'
import { RANGES } from '../../../connectors/dash0/overview.js'
import { queriesOf, blocksOf, subsOf, askedOf } from '../../../connectors/spec-page.js'
import { ChartGrid } from '../../templates/chart-grid/chart-grid.jsx'

// A page drawn from a Ditt0Page spec (connectors/spec-page.js, types/index.d.ts): plain JSON naming the blocks, each
// one an existing component. Another mod opens it with $.ditt0.open(spec), Claude with the ditt0_show tool.
// spec: the spec as normalizeSpec gave it, each data block with its key; data: { key: read }, what each block's
// query answered or what it carries (inline), null or absent until it came; range, at, auto, failed, refreshing,
// onRangeChange, onAutoChange, onClose: as every live page's (live-page.js). A page whose blocks all carry their own
// data asks nothing: it shows no range or Auto-refresh, and at is when its data last changed

const TEXT_COLORS = ['default', 'subtle', 'intense', 'error', 'warning', 'info', 'healthy', 'debug', 'unknown']
const BADGE_COLORS = ['default', 'critical', 'attention', 'success', 'severe', 'primary']
const CELL_STATUSES = ['error', 'warning', 'info', 'healthy', 'debug', 'unknown']
const THRESHOLD_STATUSES = ['healthy', 'warning', 'error', 'info', 'debug', 'unknown']
const RANGE_LABELS = { '15m': 'Last 15 minutes', '1h': 'Last 1 hour', '6h': 'Last 6 hours', '24h': 'Last 24 hours' }
const LINE_TYPES = ['braille', 'box', 'bars']

const str = (v) => typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)
const num = (v) => typeof v === 'number' && Number.isFinite(v) ? v : null
// A props object without the props left out: an undefined prop reaching a Client is refused
const defined = (props) => Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))

// Series as a chart takes them: values numbers or null, all one length. A series promql names by its id alone (#1,
// no labels) takes the block's title, so its legend and hover card say what it is
const seriesOf = (series, title) => {
    const list = (Array.isArray(series) ? series : []).filter(s => s && typeof s === 'object')
    const length = Math.max(0, ...list.map(s => Array.isArray(s.values) ? s.values.length : 0))
    return list.map(s => {
        const values = Array.from({ length }, (_, i) => num(s.values?.[i]))
        const bare = /^#?\d+$/.test(str(s.name)) && !Object.keys(s.attributes ?? {}).length
        return defined({ name: bare || !str(s.name) ? title || 'value' : str(s.name), values, attributes: s.attributes && typeof s.attributes === 'object' ? s.attributes : undefined })
    })
}
// A series as one value, by a Perses calculation: last and first are the last and first samples, a gap there too;
// last-number and first-number skip gaps; mean, sum, min and max are over the samples it has. Without one, the
// last sample it has
export const reduceValues = (values, calculation) => {
    const list = (Array.isArray(values) ? values : []).map(num)
    const numbers = list.filter(v => v !== null)
    switch (calculation) {
        case 'last': return list.length ? list[list.length - 1] : null
        case 'first': return list.length ? list[0] : null
        case 'first-number': return numbers[0] ?? null
        case 'mean': return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null
        case 'sum': return numbers.length ? numbers.reduce((a, b) => a + b, 0) : null
        case 'min': return numbers.length ? Math.min(...numbers) : null
        case 'max': return numbers.length ? Math.max(...numbers) : null
        default: return numbers[numbers.length - 1] ?? null
    }
}

// What a block read: its own answer, or its queries' answers drawn together, each series named by its query's name
// ('{{device}} - CPU', its labels put in; a name that comes out empty keeps the series' own). Null until one came
export const readOf = (b, data) => {
    const subs = subsOf(b)
    if (!subs.length) return data[b.key]
    const reads = subs.map(q => ({ q, read: data[q.key] })).filter(({ read }) => read && Array.isArray(read.series))
    if (!reads.length) return null
    const nameFor = (s, template) => (template ? template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => str(s.attributes?.[k])).trim() : '') || s.name
    return {
        series: reads.flatMap(({ q, read }) => read.series.map(s => ({ ...s, name: nameFor(s, str(q.name)) }))),
        times: reads.map(({ read }) => read.times).filter(Array.isArray).sort((x, y) => y.length - x.length)[0] ?? [],
        link: reads.map(({ read }) => read.link).find(Boolean) ?? null,
    }
}
// Whether a block's last query failed: its own, or, with queries, any of them while none has data
const failedOf = (b, data, failed) => {
    const subs = subsOf(b)
    if (!subs.length) return failed.includes(b.key)
    return subs.some(q => failed.includes(q.key)) && !readOf(b, data)
}

// Thresholds as Stat and Gauge take them: [{ value, color }], color a status; anything else is left out
const thresholdsOf = (list) => (Array.isArray(list) ? list : []).filter(t => t && num(t.value) !== null && THRESHOLD_STATUSES.includes(t.color)).map(t => ({ value: t.value, color: t.color }))

// A round number at or above v, for a gauge with no max: 1, 2 or 5 times a power of ten
const ceilingOf = (v) => {
    if (!(v > 0)) return 1
    const p = 10 ** Math.floor(Math.log10(v))
    return [1, 2, 5, 10].map(m => m * p).find(m => m >= v)
}
// A gauge's readings, [{ label, value }]: its own value, or a series' each by its calculation
const gaugeReadingsOf = (read, calculation) => {
    if (read && num(read.value) !== null) return [{ label: '', value: read.value }]
    if (Array.isArray(read?.series)) return read.series.map(s => ({ label: str(s.name), value: reduceValues(s.values, calculation) }))
    return null
}

// Whether an answer has a sample to draw: no series, or series whose every sample is blank, have none
const hasSamples = (series) => Array.isArray(series) && series.some(s => Array.isArray(s?.values) && s.values.some(v => num(v) !== null))

// What a data block draws when its query answered with no samples
const NoData = () => {
    const ui = el()
    return <ui.Text dimColor>No data in this time range.</ui.Text>
}

// A table cell as Table takes it: text, a Badge, or text in a status colour. A colour is never taken from the spec
const cellOf = (cell) => {
    if (cell && typeof cell === 'object') {
        if (BADGE_COLORS.includes(cell.badge)) return { text: str(cell.text), badge: cell.badge }
        if (CELL_STATUSES.includes(cell.status)) return { text: str(cell.text), color: status(cell.status).inline }
        return str(cell.text)
    }
    return str(cell)
}
const SPAN_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'service', label: 'Service' },
    { key: 'start', label: 'Start time' },
    { key: 'duration', label: 'Duration', align: 'right' },
    { key: 'status', label: 'Status' },
]
// A table's columns and rows, from its rows, or from spans getSpans read (connectors/dash0/spans.js)
// sort: 'slowest' puts the spans read longest first; else newest first, as getSpans answers
const tableOf = (read, sort, b = {}) => {
    if (Array.isArray(read?.series) && !Array.isArray(read?.rows)) return {
        columns: [{ key: 'name', label: 'Series' }, { key: 'value', label: 'Value', align: 'right' }],
        rows: seriesOf(read.series, str(b.title)).map(s => ({ name: s.name, value: formatValue(reduceValues(s.values, b.calculation), str(b.unit)) })),
    }
    if (Array.isArray(read?.spans)) return {
        columns: SPAN_COLUMNS,
        rows: (sort === 'slowest' ? [...read.spans].sort((a, b) => b.duration - a.duration) : read.spans).map(s => ({
            name: s.status === 'ERROR' ? { text: s.name, color: status('error').inline } : s.name,
            service: s.service,
            start: `${clockTime(s.start, { seconds: true })}`,
            duration: formatValue(s.duration, 'seconds'),
            status: { text: s.status, badge: s.status === 'ERROR' ? 'critical' : 'default' },
        })),
    }
    const rows = (Array.isArray(read?.rows) ? read.rows : []).filter(r => r && typeof r === 'object')
    const columns = Array.isArray(read?.columns) && read.columns.length
        ? read.columns.filter(c => c && c.key).map(c => defined({ key: str(c.key), label: str(c.label ?? c.key), align: c.align === 'right' ? 'right' : undefined }))
        : Object.keys(rows[0] ?? {}).map(key => ({ key, label: key }))
    return { columns, rows: rows.map(r => Object.fromEntries(columns.map(c => [c.key, cellOf(r[c.key])]))) }
}
// Bars from bars, from series and labels, or a bar per series of a promql answer at its last sample
const barsOf = (read, title, calculation) => {
    if (Array.isArray(read?.bars)) return { bars: read.bars.filter(b => b && typeof b === 'object').map(b => ({ label: str(b.label), value: num(b.value) ?? 0 })) }
    if (Array.isArray(read?.series) && Array.isArray(read.labels)) return { series: seriesOf(read.series, title), labels: read.labels.map(str) }
    if (Array.isArray(read?.series)) return { bars: seriesOf(read.series, title).map(s => ({ label: s.name, value: reduceValues(s.values, calculation) ?? 0 })) }
    return null
}

// A pie's slices: its own, or bars' and a promql answer's, a slice per series at its last sample
const slicesOf = (read, title, calculation) => {
    if (Array.isArray(read?.slices)) return read.slices.filter(s => s && typeof s === 'object').map(s => ({ label: str(s.label), value: Math.max(0, num(s.value) ?? 0) }))
    const bars = barsOf(read, title, calculation)
    return bars?.bars ? bars.bars.map(b => ({ ...b, value: Math.max(0, b.value) })) : null
}
// A gantt's tasks, each with a label and a start
const tasksOf = (read) => Array.isArray(read?.tasks)
    ? read.tasks.filter(t => t && typeof t === 'object').map(t => defined({ label: str(t.label), section: t.section ? str(t.section) : undefined, start: t.start, end: t.end, milestone: t.milestone === true || undefined }))
    : null

// A chart in a card, its title bright and its unit dim beside it, as the Tracing page heads its charts
function Card({ title, unit, children }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
            {title || unit ? (
                <ui.Box flexDirection="row" flexWrap="wrap" columnGap={1}>
                    {title ? <Text color="intense">{title}</Text> : null}
                    {unit ? <ui.Text dimColor wrap="wrap">{unit}</ui.Text> : null}
                </ui.Box>
            ) : null}
            {children}
        </ui.Box>
    )
}

export function SpecPage({ spec, data = {}, range = '1h', at = null, auto = true, failed = [], refreshing = false, onRangeChange, onAutoChange, onClose }) {
    const ui = el()
    const blocks = spec?.blocks ?? []
    const asks = spec ? Object.keys(queriesOf(spec)(range, 0)).length : 0
    // The blocks and stats that ask, and those whose last query failed: what the freshness line counts, as panels,
    // so a panel of three queries counts once
    const asking = blocksOf(blocks).filter(b => askedOf(b))
    const failedPanels = asking.filter(b => subsOf(b).length ? subsOf(b).some(q => failed.includes(q.key)) : failed.includes(b.key)).map(b => b.key)
    const zone = at ? zoneOf(at) : undefined
    // Open in Dash0 goes where the first answer that has a link points; only the first link is the CTA
    const firstLink = blocksOf(blocks).map(b => readOf(b, data)?.link).find(Boolean)
    let ctas = 0
    const what = (b) => str(b.title || b.label).toLowerCase() || 'data'

    // Each block keys its controls under its own key: two panels of the same series are two charts
    const draw = (b) => inScope(`${b.key ?? ''}/`, () => drawBlock(b))
    const drawBlock = (b) => {
        const read = readOf(b, data)
        const isFailed = failedOf(b, data, failed)
        switch (b.type) {
            case 'heading': return <Heading level={['h1', 'h2', 'h3'].includes(b.level) ? b.level : 'h3'}>{str(b.text)}</Heading>
            case 'text': return <Text color={TEXT_COLORS.includes(b.color) ? b.color : 'default'} wrap="wrap">{str(b.text)}</Text>
            case 'markdown': return (
                <ui.Box flexDirection="column">
                    {b.title ? <Text color="intense">{str(b.title)}</Text> : null}
                    <ui.Markdown text={str(b.text)} />
                </ui.Box>
            )
            case 'badge': return <ui.Box flexDirection="row"><Badge label={str(b.label || b.text)} color={BADGE_COLORS.includes(b.color) ? b.color : 'default'} /></ui.Box>
            case 'tags': return (
                <ui.Box flexDirection="row" flexWrap="wrap" columnGap={1}>
                    {(Array.isArray(b.tags) ? b.tags : []).map(t => <Tag label={str(t?.label)} value={str(t?.value)} />)}
                </ui.Box>
            )
            case 'link': {
                const href = str(b.href) || firstLink
                if (!/^https?:\/\//.test(href ?? '')) return null
                return <ui.Box flexDirection="row"><Link href={href} label={str(b.label) || 'Open in Dash0'} variant={ctas++ ? 'default' : 'cta'} /></ui.Box>
            }
            case 'stats': return (
                <ui.Box flexDirection="row" flexWrap="wrap" columnGap={4}>
                    {b.items.flatMap(item => {
                        const own = readOf(item, data)
                        const thresholds = thresholdsOf(item.thresholds)
                        const props = { label: str(item.label), unit: str(item.unit), goodWhen: item.goodWhen === 'down' ? 'down' : 'up', size: 'small', ...(thresholds.length ? { thresholds } : {}) }
                        // A query of several series is a stat each, named by its series, as a Perses stat panel draws them
                        if (own && Array.isArray(own.series) && own.series.length > 1) return seriesOf(own.series, str(item.label)).map(s => (
                            <Stat {...props} label={s.name} values={s.values} {...defined({ value: item.calculation ? reduceValues(s.values, item.calculation) ?? undefined : undefined })} />
                        ))
                        if (own && Array.isArray(own.series)) return <Stat {...props} {...statOf(own)} {...defined({ value: item.calculation ? reduceValues(own.series[0]?.values, item.calculation) ?? undefined : undefined })} />
                        if (own && (Array.isArray(own.values) || own.value !== undefined)) return <Stat {...props} {...defined({ values: Array.isArray(own.values) ? own.values.map(num) : undefined, value: num(own.value) ?? undefined })} />
                        return panel(null, failedOf(item, data, failed), str(item.label).toLowerCase() || 'stat', () => null, `loading-${item.key}`)
                    })}
                </ui.Box>
            )
            case 'timeseries': return (
                <Card title={str(b.title)} unit={str(b.subtitle)}>
                    {panel(read && Array.isArray(read.series) ? read : null, isFailed, what(b), (r) => !hasSamples(r.series) ? <NoData /> : (
                        <Timeseries {...defined({
                            series: seriesOf(r.series, str(b.title)),
                            times: Array.isArray(r.times) ? r.times.map(str) : undefined,
                            unit: str(b.unit),
                            lineType: LINE_TYPES.includes(b.lineType) ? b.lineType : undefined,
                            stacked: b.stacked === true || undefined,
                            timeLabel: zone,
                        })} />
                    ), `loading-${b.key}`)}
                </Card>
            )
            case 'bars': return (
                <Card title={str(b.title)} unit={str(b.subtitle)}>
                    {panel(barsOf(read, str(b.title), b.calculation), isFailed, what(b), (r) => Array.isArray(read?.series) && !Array.isArray(read?.labels) && !hasSamples(read.series) ? <NoData /> : (
                        <BarChart {...r} alt={str(b.alt) || str(b.title) || 'Bar chart'} unit={str(b.unit)} orientation={b.orientation === 'horizontal' ? 'horizontal' : 'vertical'} grouping={b.stacked ? 'stacked' : 'grouped'} />
                    ), `loading-${b.key}`)}
                </Card>
            )
            case 'pie': return (
                <Card title={str(b.title)} unit={str(b.subtitle)}>
                    {panel(slicesOf(read, str(b.title), b.calculation), isFailed, what(b), (slices) => !slices.length || (Array.isArray(read?.series) && !hasSamples(read.series)) ? <NoData /> : b.variant === 'squares'
                        ? <SquareChart slices={slices} unit={str(b.unit)} />
                        : <PieChart slices={slices} unit={str(b.unit)} />, `loading-${b.key}`)}
                </Card>
            )
            case 'gauge': return (
                <Card title={str(b.title)} unit={str(b.subtitle)}>
                    {panel(gaugeReadingsOf(read, b.calculation), isFailed, what(b), (readings) => {
                        if (!readings.length || readings.every(r => r.value === null)) return <NoData />
                        const thresholds = thresholdsOf(b.thresholds)
                        const min = num(b.min) ?? 0
                        const max = num(b.max) ?? (b.unit === 'percent' ? 100 : b.unit === 'ratio' ? 1 : ceilingOf(Math.max(...readings.map(r => r.value ?? 0), ...thresholds.map(t => t.value))))
                        return (
                            <ui.Box flexDirection="column" gap={1}>
                                {readings.map(r => <Gauge label={readings.length > 1 ? r.label : ''} value={r.value} min={min} max={max} unit={str(b.unit)} thresholds={thresholds} />)}
                            </ui.Box>
                        )
                    }, `loading-${b.key}`)}
                </Card>
            )
            case 'gantt': return (
                <Card title={str(b.title)} unit={str(b.subtitle)}>
                    {panel(tasksOf(read), isFailed, what(b), (tasks) => <GanttChart tasks={tasks} />, `loading-${b.key}`)}
                </Card>
            )
            case 'diagram': return <Card title={str(b.title)} unit={str(b.subtitle)}><FlowDiagram source={str(b.source)} /></Card>
            case 'table': return (
                <ui.Box flexDirection="column">
                    {b.title ? <Text color="intense">{str(b.title)}</Text> : null}
                    {panel(read ? tableOf(read, b.spans?.sort, b) : null, isFailed, what(b), (r) => r.rows.length
                        ? <Table columns={r.columns} rows={r.rows} />
                        : <ui.Text dimColor>Nothing in this time range.</ui.Text>, `loading-${b.key}`)}
                </ui.Box>
            )
            // Side by side as a ChartGrid: as many as fit a chart's width each, stacking in a narrow pane
            case 'row': return (
                <ChartGrid id={`row-${b.key}`}>
                    {b.blocks.map(child => draw(child))}
                </ChartGrid>
            )
            case 'column': return <ui.Box flexDirection="column" gap={1}>{b.blocks.map(draw)}</ui.Box>
            case 'card': return <Card title={str(b.title)} unit={str(b.subtitle)}><ui.Box flexDirection="column" gap={1}>{b.blocks.map(draw)}</ui.Box></Card>
            default: return null
        }
    }

    return (
        <ui.Box flexDirection="column" gap={1}>
            <Heading level="h2">{str(spec?.title)}</Heading>
            {asks ? (
                <ui.Box flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={2}>
                    <Select id="spec-range" label="Time range" options={RANGES.map(r => ({ value: r.value, label: RANGE_LABELS[r.value] ?? r.label }))} value={range} onValueChange={onRangeChange} />
                    <Switch id="spec-auto" label="Auto" checked={auto} onCheckedChange={onAutoChange} />
                </ui.Box>
            ) : null}
            <Freshness at={at} auto={asks ? auto : true} failed={failedPanels} panels={asking.length} refreshing={refreshing} />
            {blocks.map(draw)}
            {onClose ? <ui.Box flexDirection="row"><Button id="close" label="Close" variant="transparent" onClick={onClose} /></ui.Box> : null}
        </ui.Box>
    )
}
