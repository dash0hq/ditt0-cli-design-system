import { el } from '../../../elements.js'
import { highlight, button } from '../../../foundations/tokens/tokens.js'
import { measure, widthOf, keyFor, hoverIdOf } from '../../../measure.js'
import { formatValue } from '../../../foundations/units/units.js'
import { MAX_SLICES, partsOf, sliceLegend, sliceCards } from '../square-chart/square-chart.jsx'

// A cell's glyph by which of its quarters are in the disc: 1 top left, 2 top right, 4 bottom left, 8 bottom right
const QUADRANTS = ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█'
// Every point inside the disc when nothing has a value: the dim empty disc
const NO_DATA = Infinity

// A cell sampled at its four quarters: its glyph the quarters inside the disc, its
// slice the one most of them are in; -1 when none is
const cellOf = (sliceAt, cx, cy) => {
    let mask = 0
    const votes = new Map()
    for (const [bit, sx, sy] of [[1, 0, 0], [2, 1, 0], [4, 0, 1], [8, 1, 1]]) {
        const slice = sliceAt(cx + (sx + 0.5) / 2, 2 * cy + sy + 0.5)
        if (slice < 0) continue
        mask |= bit
        votes.set(slice, (votes.get(slice) ?? 0) + 1)
    }
    return [QUADRANTS[mask], mask ? [...votes].sort((a, b) => b[1] - a[1])[0][0] : -1]
}

// The disc's cells: radius lines tall, twice that wide, as a terminal cell is twice as tall
// as it is wide, so it is round on screen. A point's slice is by its angle, clockwise from 12 o'clock
export const discOf = (values, radius) => {
    const total = values.reduce((sum, v) => sum + v, 0)
    let seen = 0
    const bounds = values.map(v => (seen += v / total))
    const sliceAt = (x, y) => {
        const dx = x - 2 * radius
        const dy = y - 2 * radius
        if (dx * dx + dy * dy > 4 * radius * radius) return -1
        if (!total) return NO_DATA
        const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1
        return bounds.findIndex(b => turn < b)
    }
    return Array.from({ length: 2 * radius }, (_, cy) => Array.from({ length: 4 * radius }, (_, cx) => cellOf(sliceAt, cx, cy)))
}

// The parts of a whole (Dash0's Pie panel) as a round pie, sliced clockwise from 12 o'clock, largest first, each
// cell in the colour of the slice most of it is in. Angles read roughly; SquareChart is the one when the exact share
// matters. Legend, cards, Other and colours are SquareChart's: hovering a slice lights its cells and its legend line
// and shows its card, name, value and share. A slice too small for a cell still has its line in the legend.
// The pie fills its Box (measure.js): its radius 4 to 6 lines, as large as fits beside the legend; 6 where the width
// isn't known (mobile), the legend moving under it when the two don't fit side by side.
// slices: [{ label, value, color, attributes }]; a slice without a colour takes the Color Manager's for its label.
// unit: as units.js formats it. maxSlices: the most slices drawn, the smallest of the rest folded into Other
export function PieChart({ slices, unit = '', maxSlices = MAX_SLICES }) {
    const ui = el()
    const parts = partsOf(slices, maxSlices)
    const key = keyFor('pie-chart', parts.map(s => s.label).join(','))
    // Each slice's own hover group: hovering one lights only its cells, its line and its card, in this chart alone
    const id = hoverIdOf(key, JSON.stringify(parts.map(s => s.value)))
    const scope = (i) => `${id}-${i}`
    // The legend's widest line as sliceLegend draws it, ■, label, value and share, and the gap before it
    const legendWidth = Math.max(7, ...parts.map(s => 2 + Math.min(32, s.label.length) + 1 + formatValue(s.value, unit).length + 7))
    const columns = widthOf(key)
    const radius = columns ? Math.max(4, Math.min(6, Math.floor((columns - 10 - legendWidth) / 4))) : 6
    const disc = discOf(parts.map(s => s.value), radius)
    const empty = button().stroke
    // A line of the disc, in runs of one slice
    const line = (row) => {
        const runs = []
        for (const [glyph, slice] of row) {
            const last = runs[runs.length - 1]
            if (last && last.slice === slice) last.glyph += glyph
            else runs.push({ glyph, slice })
        }
        // Each run its own Text in a row, not nested in one: in the terminal a nested Text lights with its group but
        // the pointer over it never starts the hover, so the card would never show
        return <ui.Box flexDirection="row">{runs.map(({ glyph, slice }) => {
            if (slice < 0) return <ui.Text>{glyph}</ui.Text>
            if (slice === NO_DATA) return <ui.Text color={empty} dimColor>{glyph}</ui.Text>
            const color = parts[slice].color
            return <ui.Text color={color} hover={{ scope: scope(slice), color: highlight(color) }}>{glyph}</ui.Text>
        })}</ui.Box>
    }
    return (
        <ui.Box flexDirection="column">
            {measure(key)}
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={3} rowGap={1}>
                <ui.Box flexDirection="column" flexShrink={0}>
                    {disc.map(line)}
                </ui.Box>
                {sliceLegend(parts, unit, scope)}
                {sliceCards(parts, unit, scope, 4 * radius + 1)}
            </ui.Box>
        </ui.Box>
    )
}
