import { Legend } from './legend.jsx'
import { series } from '../../foundations/tokens/tokens.js'
import { requestRates24h } from '../../../fixtures/dash0-24h.js'

export default { title: 'Components/Charts/Legend', component: Legend }

// Two series of a line chart
export const Default = {
    render: () => Legend({ items: [{ name: 'p50', color: series(0) }, { name: 'p99', color: series(1) }] }),
}

// Every service of the 24 hours of request rates: the legend goes on to the next line, and a long name is shortened
export const ManySeries = {
    render: () => Legend({ items: requestRates24h.map((s, i) => ({ name: s.name, color: series(i) })) }),
}

// A bar chart's: a block for a swatch
export const Bars = {
    render: () => Legend({ items: [{ name: 'OK', color: series(0) }, { name: 'ERROR', color: '#e33238' }], swatch: '█' }),
}
