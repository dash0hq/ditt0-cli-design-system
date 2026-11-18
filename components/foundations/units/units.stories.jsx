import { el } from '../../elements.js'
import { formatValue } from './units.js'

// Each unit beside values of a few sizes, as formatValue writes them: a row a unit, the raw value dim under it
const EXAMPLES = {
    bytes: [512, 1200, 3.2e9, 230142137683],
    seconds: [0.00085, 0.0372, 1.8, 5400],
    milliseconds: [0.84, 372, 1800],
    percent: [0.5, 42.13, 100],
    ratio: [0.005, 0.5, 1],
    decimal: [0.4, 1128, 12521, 2.5e6],
    '/s': [12.4, 1128, 12500],
}

function Units({ units }) {
    const { Box, Text } = el()
    return Box({
        flexDirection: 'column',
        children: units.map(unit => Box({
            flexDirection: 'row',
            columnGap: 2,
            children: [
                Text({ dimColor: true, children: [unit.padEnd(12)] }),
                ...EXAMPLES[unit].map(v => Text({ children: [formatValue(v, unit)] })),
            ],
        })),
    })
}

export default { title: 'Foundations/Units', component: Units }

export const Default = { args: { units: Object.keys(EXAMPLES) } }
