import { SquareChart } from './square-chart.jsx'
import { requestRates24h } from '../../../../fixtures/dash0-24h.js'
import { spansByStatus } from '../../../../fixtures/dash0-span-status.js'

export default { title: 'Components/Charts/SquareChart', component: SquareChart }

const sum = (values) => values.reduce((a, v) => a + (v ?? 0), 0)
const mean = (values) => sum(values) / Math.max(1, values.filter(v => v !== null).length)

// Requests per second by service over the day, fixtures/dash0-24h.js: twelve services, the smallest four folded into Other
export const Default = {
    args: { slices: requestRates24h.map(s => ({ label: s.name, value: mean(s.values) })), unit: '/s' },
}

// The api service's spans over four hours by status, fixtures/dash0-span-status.js: UNSET fills nearly every
// square, ERROR is too small for one and keeps its line in the legend. Span status colours come from the Color Manager
export const SpanStatus = {
    args: { slices: spansByStatus.map(s => ({ label: s.name, value: sum(s.values), attributes: s.attributes })), unit: 'spans' },
}

// Three slices, round shares
export const Few = {
    args: { slices: [{ label: 'eu-west-1', value: 50 }, { label: 'us-east-1', value: 30 }, { label: 'eu-central-1', value: 20 }], unit: 'percent' },
}

export const NoData = { args: { slices: [] } }
