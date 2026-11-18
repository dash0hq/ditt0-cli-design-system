import { Gauge } from './gauge.jsx'
import { el } from '../../../elements.js'

export default { title: 'Components/Charts/Gauge', component: Gauge }

export const Default = { args: { label: 'CPU usage', value: 42, unit: 'percent' } }

// Past 70% warning, past 90% error: the filled squares take the colour the value reaches, each threshold is ticked
export const Thresholds = {
    args: {
        label: 'Memory used',
        value: 7.4e9,
        max: 8e9,
        unit: 'bytes',
        thresholds: [{ value: 5.6e9, color: 'warning' }, { value: 7.2e9, color: 'error' }],
    },
}

// A budget left: under 25% warning
export const Budget = {
    args: { label: 'Error budget left', value: 61.5, unit: 'percent', thresholds: [{ value: 0, color: 'warning' }, { value: 25, color: 'healthy' }] },
}

export const NoData = { args: { label: 'Disk used', value: null, unit: 'percent' } }

// A gauge per pod, one under another
export const Stacked = {
    render: () => {
        const { Box } = el()
        const thresholds = [{ value: 70, color: 'warning' }, { value: 90, color: 'error' }]
        return Box({ flexDirection: 'column', rowGap: 1, children: [
            Gauge({ label: 'fraud-detector-0 CPU', value: 38.2, unit: 'percent', thresholds, width: 20 }),
            Gauge({ label: 'fraud-detector-1 CPU', value: 76.9, unit: 'percent', thresholds, width: 20 }),
            Gauge({ label: 'fraud-detector-2 CPU', value: 93.4, unit: 'percent', thresholds, width: 20 }),
        ] })
    },
}
