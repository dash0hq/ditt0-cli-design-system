import { el } from '../../../elements.js'
import { seriesUnset, highlight, button } from '../../../foundations/tokens/tokens.js'
import { keyFor, hoverIdOf } from '../../../measure.js'
import { getColor } from '../../../foundations/color-manager/color-manager.js'
import { formatValue } from '../../../foundations/units/units.js'

// The squares in the grid: 10 by 10, so a square is 1% of the whole
const SIDE = 10
// Slices past this many fold into one Other: past nine, the auto palette repeats colours
export const MAX_SLICES = 9

// Each slice's whole squares out of cells, by largest remainder, so they add up to exactly cells
export const squaresOf = (values, cells = SIDE * SIDE) => {
    const total = values.reduce((a, v) => a + v, 0)
    if (!total) return values.map(() => 0)
    const exact = values.map(v => v / total * cells)
    const squares = exact.map(Math.floor)
    const order = exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0])
    const missing = cells - squares.reduce((a, s) => a + s, 0)
    for (let k = 0; k < missing; k++) squares[order[k][1]]++
    return squares
}

// The slices drawn: those with a value, largest first; past maxSlices, the smallest folded into one Other in the unset
// series colour. A slice without a colour takes the Color Manager's for its label, as a bar or a line of the same name does
export const partsOf = (slices, maxSlices = MAX_SLICES) => {
    const sorted = slices.filter(s => (s.value ?? 0) > 0).sort((a, b) => b.value - a.value)
    const shown = sorted.length > maxSlices
        ? [...sorted.slice(0, maxSlices - 1), { label: 'Other', value: sorted.slice(maxSlices - 1).reduce((a, s) => a + s.value, 0), color: seriesUnset() }]
        : sorted
    return shown.map(s => ({ ...s, color: s.color ?? getColor('auto', s.label, s.attributes) }))
}

// Each slice's value and share as the legend and the cards print them
const readouts = (parts, unit) => {
    const total = parts.reduce((a, s) => a + s.value, 0)
    return { values: parts.map(s => formatValue(s.value, unit)), shares: parts.map(s => formatValue(s.value / total * 100, 'percent')) }
}

// The legend beside a chart of parts: a line per slice with its value and share, lit with its slice; no data without one
export const sliceLegend = (parts, unit, scope) => {
    const ui = el()
    const { values, shares } = readouts(parts, unit)
    const labelWidth = Math.min(32, Math.max(0, ...parts.map(s => s.label.length)))
    const valueWidth = Math.max(0, ...values.map(v => v.length))
    return (
        <ui.Box flexDirection="column" flexShrink={1}>
            {parts.length ? parts.map((s, i) => (
                <ui.Box flexDirection="row" columnGap={1}>
                    <ui.Text color={s.color} hover={{ scope: scope(i), color: highlight(s.color) }}>■</ui.Text>
                    <ui.Box width={labelWidth} flexShrink={1}><ui.Text wrap="truncate-middle" hover={{ scope: scope(i), bold: true }}>{s.label}</ui.Text></ui.Box>
                    <ui.Text bold>{values[i].padStart(valueWidth)}</ui.Text>
                    <ui.Text dimColor>{shares[i].padStart(6)}</ui.Text>
                </ui.Box>
            )) : <ui.Text dimColor>no data</ui.Text>}
        </ui.Box>
    )
}

// A card per slice, over the legend at the chart's right (left: the chart's width and one), shown while the slice is
// hovered; a solid fill so the legend under it doesn't show through. Drawn last: a later sibling paints over an
// earlier one, so drawn first the legend would cover it
export const sliceCards = (parts, unit, scope, left) => {
    const ui = el()
    const { values, shares } = readouts(parts, unit)
    const cardWidth = Math.max(0, ...parts.map((s, i) => Math.max(s.label.length + 2, values[i].length + shares[i].length + 1))) + 4
    return parts.map((s, i) => (
        <ui.Box
            position="absolute"
            top={0}
            left={left}
            display="none"
            hover={{ scope: scope(i), display: 'flex' }}
            flexDirection="column"
            width={cardWidth}
            borderStyle="round"
            borderDimColor
            backgroundColor="inverseText"
            paddingX={1}
        >
            <ui.Text><ui.Text color={s.color}>■ </ui.Text>{s.label}</ui.Text>
            <ui.Text><ui.Text bold>{values[i]}</ui.Text><ui.Text dimColor>{` ${shares[i]}`}</ui.Text></ui.Text>
        </ui.Box>
    ))
}

// The parts of a whole (Dash0's Pie panel) as a waffle: a 10 × 10 square of small squares, each 1%, packed edge to
// edge, filled slice by slice from the top left, largest first, in each slice's colour. Squares compare better than
// angles, so this is the one when the exact share matters; PieChart draws the same slices round.
// Hovering a slice lights its squares and its legend line, and shows its card: name, value and share. A legend beside
// the square names each slice with its value and share; it moves under the square when the two don't fit side by
// side. A slice too small for one square still has its line in the legend.
// slices: [{ label, value, color, attributes }]; a slice without a colour takes the Color Manager's for its label,
// as a bar or a line of the same name does. unit: as units.js formats it
// maxSlices: the most slices drawn, the smallest of the rest folded into Other, in the unset series colour
export function SquareChart({ slices, unit = '', maxSlices = MAX_SLICES }) {
    const ui = el()
    const parts = partsOf(slices, maxSlices)
    const squares = squaresOf(parts.map(s => s.value))
    // The slice each square belongs to, top left to bottom right; -1 is empty, when nothing has a value
    const owner = squares.flatMap((n, i) => new Array(n).fill(i))
    while (owner.length < SIDE * SIDE) owner.push(-1)
    // Each slice's own hover group: hovering one lights only its squares, its line and its card, in this chart alone
    const id = hoverIdOf(keyFor('square-chart', parts.map(s => s.label).join(',')), JSON.stringify(parts.map(s => s.value)))
    const scope = (i) => `${id}-${i}`
    // A line of the square: two rows of squares in one line of cells. A terminal cell is twice as tall as it is
    // wide, so a square is half a cell, ▀ drawing the top one in its colour on the bottom one's: the whole is 10
    // cells by 5 lines, and the squares touch, so each slice reads as an area of the one square.
    // A cell holding two slices hovers as its top one
    const empty = button().stroke
    const line = (r) => {
        const runs = []
        for (let c = 0; c < SIDE; c++) {
            const top = owner[r * 2 * SIDE + c]
            const bottom = owner[(r * 2 + 1) * SIDE + c]
            const last = runs[runs.length - 1]
            if (last && last.top === top && last.bottom === bottom) last.n++
            else runs.push({ top, bottom, n: 1 })
        }
        const colorOf = (i) => i < 0 ? empty : parts[i].color
        // Each run its own Text in a row, not nested in one: in the terminal a nested Text lights with its group but
        // the pointer over it never starts the hover, so the card would never show
        return <ui.Box flexDirection="row">{runs.map(({ top, bottom, n }) => {
            if (top < 0 && bottom < 0) return <ui.Text dimColor>{'░'.repeat(n)}</ui.Text>
            const owner = top < 0 ? bottom : top
            const hover = { scope: scope(owner), ...(top >= 0 ? { color: highlight(colorOf(top)) } : {}), ...(bottom === owner ? { backgroundColor: highlight(colorOf(bottom)) } : {}) }
            return top === bottom
                ? <ui.Text color={colorOf(top)} hover={{ scope: scope(owner), color: highlight(colorOf(top)) }}>{'█'.repeat(n)}</ui.Text>
                : <ui.Text color={colorOf(top)} backgroundColor={colorOf(bottom)} hover={hover}>{'▀'.repeat(n)}</ui.Text>
        })}</ui.Box>
    }
    return (
        <ui.Box flexDirection="row" flexWrap="wrap" columnGap={3} rowGap={1}>
            <ui.Box flexDirection="column" flexShrink={0}>
                {Array.from({ length: SIDE / 2 }, (_, r) => line(r))}
            </ui.Box>
            {sliceLegend(parts, unit, scope)}
            {sliceCards(parts, unit, scope, SIDE + 1)}
        </ui.Box>
    )
}
