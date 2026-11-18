import { Stat } from './stat.jsx'
import { el } from '../../../elements.js'
import { requestRates24h } from '../../../../fixtures/dash0-24h.js'
import { apiLatency } from '../../../../fixtures/dash0.js'

export default { title: 'Components/Charts/Stat', component: Stat }

// api's requests per second over the day in fixtures/dash0-24h.js, compared with the first sample
const api = requestRates24h.find(s => s.name === 'api').values
const p99 = apiLatency.find(s => s.name === 'p99').values

export const Default = {
    args: { label: 'api requests', values: api, unit: '/s', previous: api[0], compareLabel: 'vs 24h ago' },
}

// Latency: down is good, so a rise is red. Past 230 ms it turns warning, past 400 ms error
export const Thresholds = {
    args: {
        label: 'api p99 latency',
        values: p99,
        unit: 'milliseconds',
        previous: p99[p99.length - 13],
        compareLabel: 'vs 1h ago',
        goodWhen: 'down',
        thresholds: [{ value: 230, color: 'warning' }, { value: 400, color: 'error' }],
    },
}

// A value without a series: no sparkline
export const Single = { args: { label: 'Storage used', value: 3.2e12, unit: 'bytes' } }

export const NoData = { args: { label: 'Error rate', value: null, unit: 'percent' } }

// A row of small stats, for a narrow pane or a summary over a chart
export const Row = {
    render: () => {
        const { Box } = el()
        return Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 4, rowGap: 1, children: [
            Stat({ label: 'Requests', value: 9627, unit: '/s', size: 'small' }),
            Stat({ label: 'Errors', value: 0.0031, unit: 'percent', size: 'small', previous: 0.0042, goodWhen: 'down', compareLabel: 'vs 1h ago' }),
            Stat({ label: 'P95', value: 0.312, unit: 'seconds', size: 'small', thresholds: [{ value: 0.3, color: 'warning' }] }),
        ] })
    },
}
