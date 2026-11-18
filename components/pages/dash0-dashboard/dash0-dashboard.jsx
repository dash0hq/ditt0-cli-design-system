import { el } from '../../elements.js'
import { Heading } from '../../atoms/heading/heading.jsx'
import { Link } from '../../atoms/link/link.jsx'
import { Button } from '../../atoms/button/button.jsx'
import { Freshness, panel, statOf } from '../live-parts.jsx'
import { Switch } from '../../atoms/switch/switch.jsx'
import { ChartControls } from '../../molecules/chart-controls/chart-controls.jsx'
import { Stat } from '../../molecules/charts/stat/stat.jsx'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { ChartCard } from '../../organisms/chart-card/chart-card.jsx'
import { ChartGrid } from '../../templates/chart-grid/chart-grid.jsx'
import { FailedChecks } from '../../organisms/failed-checks/failed-checks.jsx'
import { Services } from '../../organisms/services/services.jsx'
import { RANGES, rangeOf } from '../../../connectors/dash0/overview.js'

const PANELS = 7

// Dash0's services, live: the page people keep open while something is on fire. Over a range ending on its last
// whole step (connectors/dash0/overview.js), three numbers (request rate, error rate, p95 latency), requests by
// service and spans by status as charts, the checks failing now, and the busiest services' RED metrics.
// data: what loadOverview read, { requests, errors, p95, byService, byStatus, services, checks }, each null until it
// came; range: the range shown, a value from overview.js RANGES; at: when the data came, ms; auto: refreshing every
// 30 seconds; failed: the panels whose last query failed, by key
// onRangeChange(value), onAutoChange(auto): the range and Auto-refresh controls were pressed
// onClose: closes the pane, from a Close button at the foot; without it, no button
export function Dash0Dashboard({ data = {}, range = '1h', at = null, auto = true, failed = [], refreshing = false, onRangeChange, onAutoChange, onClose }) {
    const ui = el()
    const { step } = rangeOf(range)
    const stepLabel = step % 3_600_000 ? `${step / 60_000}m` : `${step / 3_600_000}h`
    const times = data.requests?.times
    const now = at ? new Date(at).toISOString() : undefined
    const requests = statOf(data.requests)
    const errors = statOf(data.errors)
    const p95 = statOf(data.p95)
    return (
        <ui.Box flexDirection="column" gap={1}>
            <ui.Box flexDirection="column">
                <Heading level="heading">Services overview</Heading>
                <ui.Text dimColor wrap="wrap">{`Server spans · dataset default${times?.length ? ` · ${times[0]}–${times[times.length - 1]}` : ''} · ${stepLabel} steps`}</ui.Text>
            </ui.Box>
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={4} alignItems="center">
                <ChartControls ranges={RANGES.map(({ value, label }) => ({ value, label }))} range={range} onRangeChange={onRangeChange} />
                <Switch id="overview-auto-refresh" label="Auto-refresh" checked={auto} onCheckedChange={onAutoChange} />
                {data.services?.link ? <Link href={data.services.link} label="Open in Dash0" variant="cta" /> : null}
            </ui.Box>
            <Freshness at={at} auto={auto} failed={failed} panels={PANELS} refreshing={refreshing} />
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={6} rowGap={1}>
                {panel(data.requests, failed.includes('requests'), 'requests', () => <Stat label="Requests" unit="/s" {...requests} />)}
                {panel(data.errors, failed.includes('errors'), 'the error rate', () => (
                    <Stat label="Error rate" unit="percent" goodWhen="down" thresholds={[{ value: 1, color: 'warning' }, { value: 5, color: 'error' }]} {...errors} />
                ))}
                {panel(data.p95, failed.includes('p95'), 'p95 latency', () => <Stat label="P95 latency" unit="seconds" goodWhen="down" {...p95} />)}
            </ui.Box>
            {/* Side by side when the pane has room for two charts (ChartGrid) */}
            <ChartGrid id="overview-charts">
                <ChartCard
                    title="Requests by service"
                    subtitle={`Server spans per second, the 8 busiest services over ${range}`}
                    ranges={[]}
                    actions={data.byService?.link ? [<Link href={data.byService.link} label="Open in Dash0" />] : []}
                >
                    {panel(data.byService, failed.includes('byService'), 'requests by service', (read) => <Timeseries series={read.series} times={read.times} unit="/s" />)}
                </ChartCard>
                <ChartCard
                    title="Spans by status"
                    subtitle={`Server spans per ${stepLabel}, by span status`}
                    ranges={[]}
                    actions={data.byStatus?.link ? [<Link href={data.byStatus.link} label="Open in Dash0" />] : []}
                >
                    {panel(data.byStatus, failed.includes('byStatus'), 'spans by status', (read) => <Timeseries series={read.series} times={read.times} lineType="bars" />)}
                </ChartCard>
            </ChartGrid>
            {panel(data.checks, failed.includes('checks'), 'failed checks', (read) => <FailedChecks checks={read.checks} now={now} href={read.link} />)}
            {panel(data.services, failed.includes('services'), 'services', (read) => (
                <Services services={read.services} window={rangeOf(range).ms / 1000} title={`Services over ${range}, busiest first`} href={read.link} />
            ))}
            {onClose ? <ui.Box flexDirection="row"><Button id="close" label="Close" variant="transparent" onClick={onClose} /></ui.Box> : null}
        </ui.Box>
    )
}
