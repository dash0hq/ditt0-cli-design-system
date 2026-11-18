import { el, surface } from '../../../elements.js'
import { measure, widthOf, keyFor, hoverIdOf } from '../../../measure.js'
import { getColor } from '../../../foundations/color-manager/color-manager.js'
import { highlight } from '../../../foundations/tokens/tokens.js'
import { scaleFor, formatValue } from '../../../foundations/units/units.js'
import { Legend } from '../../../atoms/legend/legend.jsx'

// The SVG's own coordinates. It fills its slot's width at SVG_HEIGHT pixels tall, stretched, since bars have no text
const WIDTH = 240
const HEIGHT = 120
const SVG_HEIGHT = 160
// The longest a horizontal bar runs in the terminal when the chart isn't told its width
const TEXT_BAR = 20
// Rows a vertical bar can rise in the terminal, and the widest a column grows for its label
const TEXT_ROWS = 8
const MAX_COLUMN = 10
// The narrowest bar inside a group, in cells
const MIN_GROUPED = 2
// A cell filled from the bottom in eighths, so a column's top lands between whole rows
const EIGHTHS = ' ▁▂▃▄▅▆▇█'
// Stacked segments touch, so colour alone can't part them: each wears a texture too, solid at the bottom
const SHADES = ['█', '▓', '▒', '░']

const fit = (s, width) => s.length <= width ? s.padEnd(width) : s.slice(0, width - 1) + '…'
// A label in the middle of its column, so it sits over the column's tick
const center = (s, width) => s.length >= width ? fit(s, width) : fit(' '.repeat(Math.floor((width - s.length) / 2)) + s, width)
// Rounded up to an odd number of cells, so a column has a middle cell for its tick
const odd = (w) => w % 2 ? w : w + 1

// A bar's value as every label and card writes it: the number, then the unit, in the chart's scale (units.js)
const valueText = (value, scale) => formatValue(value, '', scale)

// Every chart is a list of groups, one per category, each holding a bar per series.
// bars: one bar per group, coloured by its label. series: a bar per series in every group, coloured by the series' name
const toGroups = ({ bars, series, labels }) => series
    ? labels.map((label, i) => ({
        label,
        bars: series.map(s => ({ name: s.name, value: s.values[i] ?? null, color: s.color ?? getColor('auto', s.name, s.attributes) })),
    }))
    : bars.map(b => ({ label: b.label, bars: [{ name: b.label, value: b.value, color: b.color ?? getColor('auto', b.label, b.attributes) }] }))

const total = (g) => g.bars.reduce((a, b) => a + (b.value ?? 0), 0)

// The top of the value scale: the tallest bar, or the tallest stack
const scaleMax = (groups, stacked) => Math.max(...groups.map(g => stacked ? total(g) : Math.max(...g.bars.map(b => b.value ?? 0)))) || 1

// Where each bar sits in the SVG: groups across the width (or down the height), the bars of a group side by side
// in the middle half of its slot, or stacked into one bar
const layout = (groups, orientation, stacked) => {
    const max = scaleMax(groups, stacked)
    const along = orientation === 'vertical' ? WIDTH : HEIGHT
    const across = orientation === 'vertical' ? HEIGHT : WIDTH
    const slot = along / groups.length
    return groups.flatMap((g, i) => {
        const per = stacked ? slot / 2 : slot / 2 / g.bars.length
        let base = 0
        return g.bars.map((b, j) => {
            // A value too small to show is a bar one unit long, never none: it is there, just small
            const length = (b.value ?? 0) > 0 ? Math.max(1, Math.round((b.value / max) * across)) : Math.round(((b.value ?? 0) / max) * across)
            const start = Math.round(i * slot + slot / 4 + (stacked ? 0 : j * per))
            const offset = base
            if (stacked) base += length
            return orientation === 'vertical'
                ? { ...b, j, label: g.label, x: start, y: HEIGHT - offset - length, w: Math.round(per), h: length }
                : { ...b, j, label: g.label, x: offset, y: start, w: length, h: Math.round(per) }
        })
    })
}

// Desktop and mobile: the SVG fills its slot's width; hover fades a bar and shows its tooltip.
// Stacked segments above the first are hatched in their own colour, 45° then 135°, as the terminal shades them
const toSvg = (groups, orientation, stacked, scale) => {
    const hatches = stacked ? groups[0].bars.slice(1).map((b, k) =>
        `<pattern id="hatch-${k + 1}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(${k % 2 ? 135 : 45})">`
        + `<rect width="4" height="4" fill="${b.color}"/><line x1="0" y1="0" x2="0" y2="4" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/></pattern>`).join('') : ''
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="${SVG_HEIGHT}" preserveAspectRatio="none">`
        + '<style>rect:hover { opacity: 0.6 }</style>'
        + (hatches ? `<defs>${hatches}</defs>` : '')
        // Dim dashed guidelines at half and the whole of the scale, under the bars, as the terminal draws them
        + [0.5, 1].map(f => orientation === 'vertical'
            ? `<line x1="0" x2="${WIDTH}" y1="${HEIGHT - f * HEIGHT + 0.5}" y2="${HEIGHT - f * HEIGHT + 0.5}" stroke="currentColor" stroke-opacity="0.3" stroke-dasharray="2 2" vector-effect="non-scaling-stroke"/>`
            : `<line y1="0" y2="${HEIGHT}" x1="${f * WIDTH - 0.5}" x2="${f * WIDTH - 0.5}" stroke="currentColor" stroke-opacity="0.3" stroke-dasharray="2 2" vector-effect="non-scaling-stroke"/>`).join('')
        + layout(groups, orientation, stacked).map(b =>
            `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${stacked && b.j > 0 ? `url(#hatch-${b.j})` : b.color}"><title>${b.label}${b.name === b.label ? '' : ` · ${b.name}`}: ${valueText(b.value, scale)}</title></rect>`
        ).join('')
        + '</svg>'
}

// A series' swatch, in the legend and the cards: a stroke, or for a stacked segment its texture
const swatch = (b, j, stacked) => el().Text({ color: b.color, children: [stacked ? SHADES[j % SHADES.length].repeat(2) : '━'] })

// Which colour is which series, in series order (Legend): a stacked segment's swatch is its texture
const legend = (groups, stacked) => Legend({
    items: groups[0].bars.map((b, j) => ({ name: b.name, color: b.color, swatch: stacked ? SHADES[j % SHADES.length].repeat(2) : '━' })),
})

// The terminal, horizontal: a row of coloured blocks per bar, with its value. Grouped, a row per series under its
// group's label and a blank row between groups; stacked, one row per group, its segments end to end and its total.
// Every bar runs along a track as long as the chart, to a round number (roundUp), with dim dotted guidelines at its
// half and its end, and an axis under the rows reading 0, the half and the end, as the vertical chart's gridlines.
// Told its width, the track runs to the end of it
const toTextRows = (groups, stacked, scale, width) => {
    const { Box, Text } = el()
    const max = roundUp(scaleMax(groups, stacked) / scale.divide) * scale.divide
    const labelWidth = Math.max(...groups.map(g => g.label.length))
    const valueWidth = Math.max(...groups.flatMap(g => stacked ? [valueText(total(g), scale).length] : g.bars.map(b => valueText(b.value, scale).length)))
    const longest = width ? Math.max(TEXT_BAR / 2, width - labelWidth - valueWidth - 2) : TEXT_BAR
    const cells = (v) => v ? Math.max(1, Math.round((v / max) * longest)) : 0
    const guides = [Math.round(longest / 2) - 1, longest - 1]
    // The track past a bar's end: its guidelines, else empty
    const rest = (from) => from < longest
        ? [Text({ dimColor: true, children: [Array.from({ length: longest - from }, (_, k) => guides.includes(from + k) ? '┊' : ' ').join('')] })]
        : []
    // Never squeezed, so a row never wraps onto a second line (as toTextColumns' line)
    const row = (label, blocks, value) => Box({
        flexDirection: 'row',
        flexShrink: 0,
        alignSelf: 'flex-start',
        columnGap: 1,
        children: [Text({ children: [label.padEnd(labelWidth)] }), Box({ flexDirection: 'row', children: blocks }), Text({ dimColor: true, children: [value] })],
    })
    const rows = groups.flatMap((g, i) => {
        if (stacked) {
            const segments = g.bars.flatMap((b, j) => cells(b.value) ? [Text({ color: b.color, children: [SHADES[j % SHADES.length].repeat(cells(b.value))] })] : [])
            return [row(g.label, [...segments, ...rest(g.bars.reduce((a, b) => a + cells(b.value), 0))], valueText(total(g), scale))]
        }
        const gap = i > 0 && g.bars.length > 1 ? [row('', rest(0), '')] : []
        return [...gap, ...g.bars.map((b, j) => {
            const n = Math.max(1, cells(b.value))
            return row(j === 0 ? g.label : '', [Text({ color: b.color, children: ['█'.repeat(n)] }), ...rest(n)], valueText(b.value, scale))
        })]
    })
    // The axis under the track: a tick at each guideline, then their values, the last ending under its tick
    const axis = Array.from({ length: longest }, (_, c) => guides.includes(c) ? '┴' : '─').join('')
    const labels = Array.from({ length: longest }, () => ' ')
    const put = (text, at) => { for (let k = 0; k < text.length && at + k < longest; k++) labels[Math.max(0, at) + k] = text[k] }
    put('0', 0)
    const half = valueText(max / 2, scale)
    put(half, Math.max(2, guides[0] - Math.floor(half.length / 2)))
    const end = valueText(max, scale)
    if (guides[0] + Math.ceil(half.length / 2) + 1 < longest - end.length) put(end, longest - end.length)
    const pad = ' '.repeat(labelWidth)
    const under = [
        Text({ dimColor: true, children: [`${pad}└${axis}`] }),
        Text({ dimColor: true, children: [`${pad} ${labels.join('').trimEnd()}`] }),
    ]
    return Box({ flexDirection: 'column', children: groups[0].bars.length > 1 ? [...rows, ...under, legend(groups, stacked)] : [...rows, ...under] })
}

// The smallest round number at least x: 1, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 times a power of ten
const roundUp = (x) => {
    if (!(x > 0)) return 1
    const power = 10 ** Math.floor(Math.log10(x))
    return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * power).find(s => s >= x * (1 - 1e-9))
}

// Three significant figures at most (two under 10), as the line chart's axis writes them, in the chart's scale
const format = (v, scale) => {
    const n = v / scale.divide
    return String(Math.abs(n) >= 1000 ? Math.round(n) : Number(n.toPrecision(Math.abs(n) >= 10 ? 3 : 2)))
}

// The terminal, vertical: a column per group from a zero baseline, its label under it, cut to the column's width.
// A grouped column is its series' bars side by side; a stacked one, its segments one on another, each its texture.
// A y axis and dim dashed gridlines, as the line chart has: a gridline's label is the value at the middle of its
// row, so a bar of exactly that value ends on the dashes. The unit, if any, sits above the axis.
// Told its width, the columns widen to fill it. Hovering a group shows its card, with the exact values
// id: the chart's own hover groups (hoverIdOf), so hovering a bar lights nothing in another chart
const toTextColumns = (groups, stacked, scale, chartWidth, id) => {
    const { Box, Text } = el()
    // Two gridlines, through the middles of rows 0 and 5, which read 3 to 1: the scale's top is set so they read 3k
    // and k for a round k, as Dash0's axis reads round numbers (d3's nice()). The steps are close together, so the
    // tallest bar keeps most of the height
    const at = (r) => (TEXT_ROWS - r - 0.5) / TEXT_ROWS
    const k = roundUp(scaleMax(groups, stacked) / scale.divide * at(0) / 3) * scale.divide
    const max = 3 * k / at(0)
    const n = stacked ? 1 : groups[0].bars.length
    const single = groups[0].bars.length === 1
    const grid = { 0: format(max * at(0), scale), 5: format(max * at(5), scale) }
    const unit = scale.suffix.trim()
    const labelWidth = Math.max(1, unit.length, ...Object.values(grid).map(l => l.length))
    const labelFit = Math.min(MAX_COLUMN, Math.max(3, ...groups.map(g => g.label.length)))
    // Bars in a group stand one cell apart. A column of n bars is n × barWidth + n - 1 cells: odd whenever n is even,
    // and odd for an odd n when barWidth is odd, so the tick always has a middle cell (under the gap, for two bars)
    const natural = n === 1 ? odd(labelFit) : n % 2 ? odd(Math.max(MIN_GROUPED, Math.ceil(labelFit / n))) : Math.max(MIN_GROUPED, Math.ceil(labelFit / n))
    // Groups of several bars stand three cells apart, so a group reads as one, apart from the next; single bars and
    // stacks one cell apart
    // Too narrow for that even at a cell a bar, the bars of a group touch, then the groups stand two cells apart,
    // then one, so the chart always fits its Box and no row wraps
    const room = chartWidth ? Math.floor((chartWidth - labelWidth - 2) / groups.length) : Infinity
    const [inner, gap] = n === 1 ? [0, 1]
        : [[1, 3], [0, 2], [0, 1]].find(([a, b]) => n + a * (n - 1) + b <= room) ?? [0, 1]
    // Told its width: what's left after the y axis, shared by the groups, the gap between each
    const fill = chartWidth ? Math.floor((room - gap - inner * (n - 1)) / n) : 0
    // Told its width, the bars take what fits, down to one cell each, so the chart never runs past its Box; untold,
    // their natural width
    const barWidth = chartWidth ? Math.max(1, n % 2 && fill % 2 === 0 && fill > 1 ? fill - 1 : fill) : natural
    const width = barWidth * n + inner * (n - 1)
    // How many eighths of row r (0 at the top) a value fills
    // A value too small for an eighth still fills one in the bottom row: a thin line, so it reads as small, not none
    const eighths = (v, r) => {
        const e = Math.max(0, Math.min(8, Math.round(((v / max) * TEXT_ROWS - (TEXT_ROWS - 1 - r)) * 8)))
        return r === TEXT_ROWS - 1 && v > 0 ? Math.max(1, e) : e
    }
    // Where each stacked segment ends, from the baseline, in eighths of a row
    const tops = (g) => {
        // Each segment with a value at least an eighth above the one under it, so a tiny one still shows
        let sum = 0
        let last = 0
        return g.bars.map(b => (last = Math.max(last + ((b.value ?? 0) > 0 ? 1 : 0), Math.round(((sum += b.value ?? 0) / max) * TEXT_ROWS * 8))))
    }
    const scope = (i) => `${id}-${i}`
    const dim = (text, i) => Text({ dimColor: true, ...(i === undefined ? {} : { hover: { scope: scope(i) } }), children: [text] })
    // A row as wide as its cells, never squeezed: a squeezed row wraps its cells onto a second line, and the ticks
    // and bars fall a row below their labels. Too wide a chart is cut at the Box's edge instead (overflow below).
    // Its width is set, as a row sized by its content is held to its parent's width, and its cells then wrap
    const line = (cells, fixed = true) => Box({ flexDirection: 'row', flexShrink: 0, alignSelf: 'flex-start', ...(fixed ? { width: span } : {}), children: cells })
    // One bar's cells in row r. A hovered bar lights, its colour moved toward the theme's text (tokens.js highlight),
    // as a hovered line does; a group lights every bar in it, each still its own colour, so the colours still tell
    // them apart.
    // shade: the texture of a full cell; a partly filled top cell is an eighth block
    const cell = (v, color, r, i, shade = '█') => {
        const e = v ? eighths(v, r) : 0
        const empty = r in grid ? '┄' : ' '
        return e
            ? Text({ color, hover: { scope: scope(i), color: highlight(color) }, children: [(e === 8 ? shade : EIGHTHS[e]).repeat(barWidth)] })
            : dim(empty.repeat(barWidth), i)
    }
    // A stacked cell. Wholly inside one segment, it wears that segment's texture. Where a segment ends inside it,
    // that segment fills its eighths from the bottom on the next segment's colour, so the boundary shows to an
    // eighth of a row, however thin the segment. A segment ending in the same cell as the one under it is lost
    // there, and kept by the legend and the card
    const stackCell = (g, r, i) => {
        const ends = tops(g)
        const bottom = (TEXT_ROWS - 1 - r) * 8
        // The segment the cell's bottom edge is in: the first to end above it
        const j = ends.findIndex(e => e > bottom)
        if (j < 0) return dim((r in grid ? '┄' : ' ').repeat(barWidth), i)
        const filled = ends[j] - bottom
        if (filled >= 8) return Text({ color: g.bars[j].color, hover: { scope: scope(i), color: highlight(g.bars[j].color) }, children: [SHADES[j % SHADES.length].repeat(barWidth)] })
        const above = ends.findIndex((e, k) => k > j && e > ends[j])
        return Text({
            color: g.bars[j].color,
            hover: { scope: scope(i), color: highlight(g.bars[j].color) },
            ...(above < 0 ? {} : { backgroundColor: g.bars[above].color }),
            children: [EIGHTHS[filled].repeat(barWidth)],
        })
    }
    const span = labelWidth + 2 + groups.length * (gap + width)
    const ticked = '─'.repeat(Math.floor((width - 1) / 2)) + '┬' + '─'.repeat(width - 1 - Math.floor((width - 1) / 2))
    // Where group i's column starts, in cells from the chart's left edge
    const left = (i) => labelWidth + 2 + i * (width + gap) + gap
    const rowsOf = (g) => g.bars.map(b => `${single ? '' : b.name + ' '}${valueText(b.value, scale)}`)
    const cardWidth = Math.max(...groups.flatMap(g => [g.label.length, ...rowsOf(g).map(r => r.length + 3)])) + 4
    return Box({
        flexDirection: 'column',
        children: [
            ...(unit ? [dim(unit.padStart(labelWidth))] : []),
            ...Array.from({ length: TEXT_ROWS }, (_, r) => line([
                dim(r in grid ? `${grid[r].padStart(labelWidth)} ┤` : `${' '.repeat(labelWidth)} │`),
                ...groups.flatMap((g, i) => [
                    dim((r in grid ? '┄' : ' ').repeat(gap)),
                    ...(stacked
                        ? [stackCell(g, r, i)]
                        : g.bars.flatMap((b, j) => [...(j > 0 && inner ? [dim(r in grid ? '┄' : ' ', i)] : []), cell(b.value, b.color, r, i)])),
                ]),
            ])),
            // The baseline, zero, with a tick under the middle of each column that brightens with its group
            line([
                dim(`${'0'.padStart(labelWidth)} └`),
                ...groups.flatMap((_, i) => [dim('─'.repeat(gap)), Text({ dimColor: true, hover: { scope: scope(i), dimColor: false, bold: true }, children: [ticked] })]),
            ]),
            line([
                dim(' '.repeat(labelWidth + 2)),
                ...groups.flatMap((g, i) => [dim(' '.repeat(gap)), Text({ hover: { scope: scope(i), bold: true }, children: [center(g.label, width)] })]),
            ]),
            ...(single ? [] : [line([dim(' '.repeat(labelWidth + 3)), legend(groups, stacked)], false)]),
            // A card per group, beside it so it hides none of it; a solid fill so the bars under it don't show through
            ...groups.map((g, i) => Box({
                position: 'absolute',
                top: unit ? 1 : 0,
                left: i < groups.length / 2 ? left(i) + width + gap : Math.max(0, left(i) - cardWidth - 1),
                display: 'none',
                hover: { scope: scope(i), display: 'flex' },
                flexDirection: 'column',
                width: cardWidth,
                borderStyle: 'round',
                borderDimColor: true,
                backgroundColor: 'inverseText',
                paddingX: 1,
                children: [
                    Text({ dimColor: true, children: [g.label] }),
                    ...g.bars.map((b, j) => Box({
                        flexDirection: 'row',
                        columnGap: 1,
                        children: [
                            swatch(b, j, stacked),
                            ...(single ? [] : [Text({ dimColor: true, children: [b.name] })]),
                            Text({ bold: true, dimColor: b.value === null, children: [valueText(b.value, scale)] }),
                        ],
                    })),
                ],
            })),
        ],
    })
}

// bars: [{ label, value, color: '#rrggbb', attributes }]; a bar without a colour takes the color manager's for its label
// series, labels: instead of bars, a bar per series at every label: [{ name, values, color, attributes }], values in labels' order
// alt: what the chart shows, in words, for a surface that reads it out
// orientation: 'vertical', columns growing up; or 'horizontal', bars growing right, one row each
// grouping: with series, 'grouped' draws their bars side by side, 'stacked' one on another, each with its texture
// unit: a unit that scales to the values' size (units.js: 'bytes', 'seconds', 'ms', 'percent', ...) or any other
// text written after the number; one scale for the chart, from its largest value (UNIT-002). Every value shown
// carries it, and a vertical chart writes it above its y axis
// The chart fills the width of the Box it sits in: in the terminal, as measured (measure.js); on desktop and
// mobile the SVG takes its slot's width
export function BarChart({ bars, series, labels, alt, orientation = 'vertical', grouping = 'grouped', unit = '' }) {
    const groups = toGroups({ bars, series, labels })
    const stacked = grouping === 'stacked' && groups[0].bars.length > 1
    const scale = scaleFor(unit, scaleMax(groups, stacked))
    const { Box, Svg } = el()
    if (surface() === 'terminal') {
        const key = keyFor('bar-chart', alt)
        // Two cells left empty on the right, so the bars don't run into the edge of what holds them
        const width = Math.max(0, widthOf(key) - 2)
        const chart = orientation === 'vertical' ? toTextColumns(groups, stacked, scale, width, hoverIdOf(key, JSON.stringify(groups))) : toTextRows(groups, stacked, scale, width)
        return Box({ flexDirection: 'column', overflow: 'hidden', children: [measure(key), chart] })
    }
    const svg = Svg({ source: toSvg(groups, orientation, stacked, scale), alt, isInteractive: true })
    return groups[0].bars.length > 1 ? Box({ flexDirection: 'column', children: [svg, legend(groups, stacked)] }) : svg
}
