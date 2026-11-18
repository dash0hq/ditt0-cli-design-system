import { ChartGrid } from './chart-grid.jsx'
import { ChartCard } from '../../organisms/chart-card/chart-card.jsx'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { requestRates24h, times24h } from '../../../fixtures/dash0-24h.js'

export default { title: 'Templates/Claude Code/Chart Grid', component: ChartGrid }

const card = (name) => (
    <ChartCard title={name} subtitle="Requests per second" ranges={[]}>
        <Timeseries series={requestRates24h.filter(s => s.name === name)} times={times24h} unit="/s" lineType="bars" />
    </ChartCard>
)

// Three services' request rates: one column in a narrow pane, two or three side by side in a wide one
export const Default = {
    render: () => <ChartGrid id="story-grid">{['api', 'order-history-api', 'fulfillment-queue-worker'].map(card)}</ChartGrid>,
}

// Two columns at most: side by side while each chart keeps near its best width, one under the other when the pane
// is too narrow for two
export const Responsive = {
    render: () => <ChartGrid id="story-grid-responsive" columns={2}>{['api', 'order-history-api', 'fulfillment-queue-worker', 'search'].map(card)}</ChartGrid>,
}
