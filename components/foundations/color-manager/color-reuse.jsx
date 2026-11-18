import { el } from '../../elements.js'
import { getColor } from './color-manager.js'

// Ten swatches to a row, as Dash0's story lays them out
const PER_ROW = 10

// What the color manager hands out: series-0 to series-<count - 1> in each palette, in the order asked for.
// The same as Dash0's ColorReuse story, without its buttons: a series asked for again keeps its colour
export function ColorReuse({ palettes = ['auto', 'categorical', 'schemeCategory10', 'schemeDark2'], count = 40 }) {
    const ui = el()
    const rows = (palette) => Array.from({ length: Math.ceil(count / PER_ROW) }, (_, r) => (
        <ui.Box flexDirection="row" columnGap={1}>
            {Array.from({ length: Math.min(PER_ROW, count - r * PER_ROW) }, (_, c) => (
                <ui.Text backgroundColor={getColor(palette, `series-${r * PER_ROW + c}`)}>{'    '}</ui.Text>
            ))}
        </ui.Box>
    ))
    return (
        <ui.Box flexDirection="column" rowGap={1}>
            {palettes.map(palette => (
                <ui.Box flexDirection="column">
                    <ui.Text bold>Palette: {palette}</ui.Text>
                    {rows(palette)}
                </ui.Box>
            ))}
        </ui.Box>
    )
}

// The colour a series takes for what its attributes say, one row per attribute set: a swatch, the set, its hex
export function ColorMeaning({ examples = [] }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column">
            {examples.map(attributes => {
                const hex = getColor('auto', Object.values(attributes).join(', '), attributes)
                const label = Object.entries(attributes).map(([k, v]) => `${k}=${v}`).join(' ')
                return (
                    <ui.Box flexDirection="row" columnGap={1}>
                        <ui.Text backgroundColor={hex}>{'    '}</ui.Text>
                        <ui.Text>{label.padEnd(42)}</ui.Text>
                        <ui.Text dimColor>{hex}</ui.Text>
                    </ui.Box>
                )
            })}
        </ui.Box>
    )
}
