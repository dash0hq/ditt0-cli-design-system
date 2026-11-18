import { PaneTemplate } from '../../templates/pane/pane.jsx'
import { Tabs } from '../../molecules/tabs/tabs.jsx'
import { Box } from '../../atoms/box/box.jsx'
import { Button } from '../../atoms/button/button.jsx'
import { Text } from '../../atoms/text/text.jsx'
import { BarChart } from '../../molecules/charts/bar-chart/bar-chart.js'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { times, apiLatency, requestRates } from '../../../fixtures/dash0.js'
import { times24h, requestRates24h } from '../../../fixtures/dash0-24h.js'

const TABS = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
    { value: 'three', label: 'Latency' },
    { value: 'four', label: 'Requests' },
    { value: 'five', label: 'Stress' },
    { value: 'six', label: 'Overlap' },
]

const BARS = [
    { label: 'Low', value: 20, color: '#2e7d32' },
    { label: 'Mid', value: 35, color: '#f9a825' },
    { label: 'High', value: 55, color: '#c62828' },
]

// The first mod's pane: a tab per demo, from a counter to 24 hours of Dash0 request rates
export function HelloTabs({ tab = 'one', count = 0, onTabChange, onCount }) {
    const body = tab === 'one'
        ? <Text>This is the first tab.</Text>
        : tab === 'two'
        ? (
            <Box>
                <Box direction="row" gap={2}>
                    <Button id="tab-more" label="add one" variant="transparent" onClick={onCount} />
                    <Text>{'Count: ' + count}</Text>
                </Box>
                <BarChart bars={BARS} alt="Low 20, Mid 35, High 55" />
            </Box>
        )
        : tab === 'three'
        ? (
            <Box>
                <Text>api latency, server spans (UTC)</Text>
                <Timeseries series={apiLatency} times={times} unit="ms" />
            </Box>
        )
        : tab === 'four'
        ? (
            <Box>
                <Text>Requests per second, server spans (UTC)</Text>
                <Timeseries series={requestRates} times={times} unit="/s" />
            </Box>
        )
        : tab === 'five'
        ? (
            <Box>
                <Text>Stress: 12 services, 24h every 5 minutes, server spans (UTC)</Text>
                <Timeseries series={requestRates24h} times={times24h} unit="/s" />
            </Box>
        )
        : (
            <Box>
                <Text>Overlap: three services on one axis, 24h every 5 minutes (UTC)</Text>
                <Timeseries series={requestRates24h.filter(s => ['fulfillment-queue-worker', 'order-history-api', 'gcp-warehouse-sync-tasks-worker'].includes(s.name))} times={times24h} unit="/s" />
            </Box>
        )
    return <PaneTemplate nav={<Tabs value={tab} onChange={onTabChange} tabs={TABS} gap={3} />} body={body} />
}
