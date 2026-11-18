import { el } from '../../elements.js'
import { ToolResultTemplate } from '../../templates/tool-result/tool-result.jsx'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { Link } from '../../atoms/link/link.jsx'
import { Switch } from '../../atoms/switch/switch.jsx'
import { clockTime, zoneOf } from '../../../connectors/dash0/promql.js'

// How current the data is, in one dim line, its time with the zone (TIME-003): refreshing, when it last came;
// stopped, the moment it shows; failed, that it kept the last data
const freshness = ({ auto, at, failed }) => {
    const zone = zoneOf(at)
    if (failed) return `Couldn't refresh. Showing data from ${clockTime(at, { seconds: true })} (${zone}).`
    return auto ? `Updated ${clockTime(at, { seconds: true })} (${zone})` : `Snapshot · ${clockTime(at)} (${zone})`
}

// A Dash0 PromQL result under its tool call: the series as a chart, then a link to the same query in Dash0 and
// how current the chart is.
// result: what connectors/dash0/promql.js reads from the tool's answer, { series, times, link }; times are the
// person's local time. unit: what the values are in (promql.js unitOf reads it from the query), for units.js
// live: from connectors/dash0/live.js, { id, canRefresh, auto, at, failed }; at is when the data drawn was
// fetched. canRefresh: whether the query is known, so an Auto-refresh switch can run it again. Absent, the chart
// draws without the line. onAutoChange(auto): the switch was pressed
export function Dash0QueryResult({ result, unit = '', live, onAutoChange }) {
    const ui = el()
    const actions = [
        ...(result.link ? [<Link href={result.link} label="Open in Dash0" variant="cta" />] : []),
        ...(live?.canRefresh ? [<Switch id={`auto-refresh-${live.id}`} label="Auto-refresh" checked={live.auto} onCheckedChange={onAutoChange} />] : []),
        ...(live ? [<ui.Text dimColor>{freshness(live)}</ui.Text>] : []),
    ]
    return <ToolResultTemplate body={<Timeseries series={result.series} times={result.times} unit={unit} />} actions={actions} />
}
