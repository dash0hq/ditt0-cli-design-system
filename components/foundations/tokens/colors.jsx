import { el } from '../../elements.js'
import { palette } from './tokens.js'

// One row per colour: a swatch, its name, its hex
const Swatch = ({ name, hex }) => {
    const ui = el()
    return (
        <ui.Box flexDirection="row" columnGap={1}>
            <ui.Text backgroundColor={hex}>{'    '}</ui.Text>
            <ui.Text>{name.padEnd(10)}</ui.Text>
            <ui.Text dimColor>{hex}</ui.Text>
        </ui.Box>
    )
}

// Dash0's colours as this library draws them, for the person's theme.
// group: 'status' (fills of the semantic colour tokens), 'badge' or 'series' (the chart palette, in order)
export function Colors({ group = 'status' }) {
    const ui = el()
    const colors = palette()[group]
    const rows = Array.isArray(colors)
        ? colors.map((hex, i) => ({ name: `series ${i}`, hex }))
        : Object.entries(colors).map(([name, hex]) => ({ name, hex: typeof hex === 'string' ? hex : hex.bg }))
    return <ui.Box flexDirection="column">{rows.map(row => <Swatch name={row.name} hex={row.hex} />)}</ui.Box>
}
