import { SeriesTable } from './series-table.jsx'
import { requestRates24h } from '../../../fixtures/dash0-24h.js'
import { apiLatency } from '../../../fixtures/dash0.js'

export default { title: 'Components/Data/SeriesTable', component: SeriesTable }

// Requests per second by service over the day, fixtures/dash0-24h.js: twelve rows, busiest now first
export const Default = { args: { series: requestRates24h, unit: '/s' } }

// api's latency quantiles, fixtures/dash0.js, in milliseconds: every column in one unit
export const Latency = { args: { series: apiLatency, unit: 'milliseconds', stats: ['current', 'min', 'mean', 'max'] } }
