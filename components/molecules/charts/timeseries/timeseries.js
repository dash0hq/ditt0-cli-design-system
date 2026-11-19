import { el, surface } from '../../../elements.js'
import { measure, widthOf, keyFor, hoverIdOf, listen } from '../../../measure.js'
import { getColor } from '../../../foundations/color-manager/color-manager.js'
import { highlight } from '../../../foundations/tokens/tokens.js'
import { scaleFor, formatValue, formatNumber, sharesScale } from '../../../foundations/units/units.js'
import { Legend } from '../../../atoms/legend/legend.jsx'
import { ChartControls } from '../../chart-controls/chart-controls.jsx'
import { chartStateOf, setChartState, holdsKeys } from '../../../chart-state.js'
import { ROWS, MULTIPLE_ROWS, BAR_ROWS, MAX_SHARED, MAX_COLUMNS, RIGHT_GAP, UP, DOWN, LEFT, RIGHT, POINT, GLYPHS, LONE, NICE_MULTIPLES, NICE_STEPS_PER_AXIS } from './timeseries.constants.js'

// A box-drawing line on every surface, a column per point, each column joining the previous point to its own.
// Its fixed values (rows, glyphs, round steps) are in timeseries.constants.js, which the Go package reads too

// Series colours come from Dash0's color manager: by name, so a series keeps its colour in every chart and
// when others are filtered out, and by meaning, so an ERROR or a 5xx is the error red wherever it sits

const glyph = (sides) => GLYPHS[sides & ~POINT] ?? LONE

// Three significant figures at most (two under 10), so 0.8359 reads 0.84 and 698.51 reads 699; pass figures for more
const format = (v, figures = Math.abs(v) >= 10 ? 3 : 2) =>
    String(Math.abs(v) >= 10 ** figures ? Math.round(v) : Number(v.toPrecision(figures)))

// Fold a series into buckets of size samples, each keeping its mean (which the line follows) and its low and
// high (for the card and the y axis); a bucket with no samples (null) stays a gap, never a zero
const bucket = (values, size) => {
    const points = []
    for (let i = 0; i < values.length; i += size) {
        const end = Math.min(i + size, values.length) - 1
        const known = values.slice(i, end + 1).filter(v => v !== null)
        points.push(known.length
            ? { index: i, end, min: Math.min(...known), max: Math.max(...known), mean: known.reduce((a, v) => a + v, 0) / known.length }
            : { index: i, end, min: null, max: null, mean: null })
    }
    return points
}

// Bars stand on the axis line, so their scale is BarChart's: 0 written on the axis, and two gridlines through the
// middles of row 0 and the row a third of the way up, reading 3k and k for a round k, where a bar of exactly that
// value ends. rows is 3n + 2 (ROWS, MULTIPLE_ROWS), so that row is whole. Null for values under zero
const ROUND = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
const barScale = (rows, { min, max }, scale) => {
    if (min < 0) return null
    const third = (2 * rows - 1) / 3
    const want = (max || 1) / scale.divide / 3
    const power = 10 ** Math.floor(Math.log10(want))
    const k = ROUND.map(m => m * power).find(x => x >= want * (1 - 1e-9))
    return { min: 0, max: 3 * k * scale.divide * rows / (rows - 0.5), labels: { 0: formatNumber(3 * k * scale.divide, scale), [third]: formatNumber(k * scale.divide, scale) } }
}

// The span a panel's y axis covers; a flat series gets room either side so its line sits mid-panel.
// zero: the span reaches zero, as bars rise from it
const range = (series, zero = false) => {
    const all = series.flatMap(s => s.points.flatMap(p => p.mean === null ? [] : [p.min, p.max]))
    if (!all.length) return { min: 0, max: 1 }
    const min = Math.min(...all, ...(zero ? [0] : []))
    const max = Math.max(...all, ...(zero ? [0] : []))
    if (min !== max) return { min, max }
    const pad = Math.abs(min) / 2 || 1
    return { min: min - pad, max: max + pad }
}

// The range widened to round numbers, as Dash0's y scale does (d3's scale.nice(), use-scales.ts): ends on whole
// steps of 1, 2 or 5 times a power of ten, about four steps apart, so max, middle and min all read round. A middle
// that wouldn't (99 to 102: 100.5) takes one more step at the top (99 to 103: 101), so every gridline's round label
// is the value where it is drawn
const nice = ({ min, max }) => {
    const raw = (max - min) / NICE_STEPS_PER_AXIS
    const power = 10 ** Math.floor(Math.log10(raw))
    const step = NICE_MULTIPLES.map(m => m * power).find(s => s >= raw)
    const lo = Math.floor(min / step) * step
    const hi = Math.ceil(max / step) * step
    const mid = (lo + hi) / 2
    return { min: lo, max: Math.abs(Number(format(mid)) - mid) > Math.abs(mid) * 1e-9 ? hi + step : hi }
}

// Whether a series that moves would draw as one flat row on the others' axis, as 600 errors do beside
// 2.5 million unset spans: it would hide its own changes, and under another series its colour
const flattens = (series, rows) => {
    const { min, max } = range(series)
    return series.some(s => {
        const known = s.points.flatMap(p => p.mean === null ? [] : [p.min, p.max])
        const span = known.length ? Math.max(...known) - Math.min(...known) : 0
        return span > 0 && span < (max - min) / (rows - 1)
    })
}

// One grid of cells, top row first. A column's point is its samples' mean (its line, where stretched): a column
// enters from the left at the previous column's point, runs to its own, and leaves right there, so the strokes
// read as one line; a gap on either side cuts the line there.
// A cell two series' strokes pass through is an overlap. overlap says what it draws:
//   'first': only the stroke of the series listed first, in its colour, as if drawn over the others; theirs
//            break for that cell, so a line passing under another shows a one-cell gap
//   'merge': both strokes as one glyph (┼ where they cross), in neither's colour, since one colour would hand
//            the other series' stroke to it
// Where a column's line sits: a stretched column's value between two samples (null beside a gap: the line ends at
// the sample), or its samples' mean
const lineOf = (p) => p.line !== undefined ? p.line : p.mean

// How far a column's samples reach past their mean, when that is more than a row (span: a row's worth of value):
// its high and low, or null where they stay within a row. What a card marks ▲ and ▼. From the mean the card
// shows, not the line: a stretched column's line runs between two samples, and its one sample is no spike
const reach = (p, span) => p.mean === null ? { high: null, low: null } : {
    high: p.max - p.mean > span ? p.max : null,
    low: p.mean - p.min > span ? p.min : null,
}

const draw = (series, rows, { min, max }, overlap = 'first') => {
    const rowOf = (v) => rows - 1 - Math.round(((v - min) / (max - min)) * (rows - 1))
    const columns = series[0].points.length
    const cells = Array.from({ length: rows }, () => Array.from({ length: columns }, () => ({ sides: 0, color: null, overlap: false })))
    const mark = (r, c, sides, color) => {
        const cell = cells[r][c]
        // Series come in order: under 'first', a cell another series already holds stays as it is
        if (overlap === 'first' && cell.color !== null && cell.color !== color) return
        cell.sides |= sides
        if (cell.color !== null && cell.color !== color) cell.overlap = true
        cell.color ??= color
    }
    for (const s of series) {
        s.points.forEach((p, c) => {
            if (lineOf(p) === null) return
            const prev = s.points[c - 1]
            const next = s.points[c + 1]
            const entry = prev && lineOf(prev) !== null ? rowOf(lineOf(prev)) : null
            const own = rowOf(lineOf(p))
            const exit = next && lineOf(next) !== null ? own : null
            const top = Math.min(own, entry ?? Infinity)
            const bottom = Math.max(own, entry ?? -Infinity)
            for (let r = top; r <= bottom; r++) {
                const sides = (r > top ? UP : 0) | (r < bottom ? DOWN : 0) | (r === entry ? LEFT : 0) | (r === exit ? RIGHT : 0)
                mark(r, c, sides || POINT, s.color)
            }
        })
    }
    return cells
}

// The y labels of a panel: max, mid and min, by row, with as many figures as it takes to write each exactly, so the
// rows' even spacing reads in them: 99 to 102 has its middle at 100.5, which at three figures would read 101.
// Numbers alone, in the panel's scale (units.js): the unit is written once, above the axis or beside the panel's name
const yLabels = (rows, { min, max, labels: set }, scale = { divide: 1 }) => {
    // Bars set their own (barScale)
    if (set) return set
    const values = [max, (max + min) / 2, min]
    let labels = values.map(v => formatNumber(v, scale))
    const exact = (l, v) => Math.abs(Number(l) * scale.divide - v) <= Math.abs(v) * 1e-9
    for (let figures = 3; figures <= 6 && (new Set(labels).size < 3 || labels.some((l, i) => !exact(l, values[i]))); figures++) labels = values.map(v => format(v / scale.divide, figures))
    return { 0: labels[0], [Math.floor((rows - 1) / 2)]: labels[1], [rows - 1]: labels[2] }
}

// What a column stands for: one sample's time, or the first to last sample it folds
// Dots: each sample the cell draws (p.dots), its time over its value, side by side
const timeOf = (p, times) => {
    const at = (i) => times?.[i] ?? `#${i}`
    const one = (q) => q.index === q.end ? at(q.index) : `${at(q.index)}–${at(q.end)}`
    return p.dots ? p.dots.map(d => one(d).padStart(p.dotWidth)).join('  ') : one(p)
}

// A column's value: its sample or the mean of those it folds, with its unit in the series' scale (units.js: 166 ms,
// 2.5 GB), then ▲ its high and ▼ its low, in the same scale, where they reach more than a row past it (span: a row's
// worth of value); or that it has none. With ▲ or ▼, the mean takes a ◆, the middle between them
const valueOf = (p, scale, span) => {
    if (p.dots) return p.dots.map(d => (d.mean === null ? 'none' : formatValue(d.mean, '', scale)).padStart(p.dotWidth)).join('  ')
    if (p.mean === null) return 'no data'
    const { high, low } = reach(p, span)
    const marked = high !== null || low !== null
    return (marked ? '◆' : '') + formatValue(p.mean, '', scale) + (high !== null ? ` ▲${formatNumber(high, scale)}` : '') + (low !== null ? ` ▼${formatNumber(low, scale)}` : '')
}

// Bars: a column per point, filled from the bottom of the axis to its value in eighths of a row (▁▂▃▄▅▆▇█), so a
// bar's top lands between whole rows. A column with no sample is empty. Spread over more columns than samples, a
// sample's bar is as wide as its columns, with an empty column before the next sample's.
// stacked (Dash0's bar display): each column's series one on another, in series order from the bottom, the axis
// up to the tallest stack; where a segment ends inside a cell, its eighth block sits on the next segment's colour,
// so every segment shows. Not stacked: the series overlap, the shorter in front, and a cell shows the shortest bar
// that fills it whole, else the tallest that reaches into it, so a shorter bar rounds down to its last whole row
// where a taller one stands behind it
const EIGHTHS = ' ▁▂▃▄▅▆▇█'
const drawBars = (series, rows, { min, max }, stacked) => {
    const points = series[0].points
    const heightOf = (v) => Math.round(((v - min) / (max - min)) * rows * 8)
    // The last column of a sample's run of two or more columns stays empty, between it and the next bar; the last
    // bar's too, so it is as wide as every other
    const runOf = (c) => points.filter(p => p.index === points[c].index).length
    const parted = (c) => (c === points.length - 1 || points[c + 1].index !== points[c].index) && runOf(c) >= 2
    // Each column's segments, bottom up, in eighths from the axis: [from, to)
    const segments = points.map((_, c) => {
        let sum = 0
        return series.flatMap(s => {
            const v = s.points[c].mean
            if (v === null) return []
            const from = heightOf(min + sum)
            sum += v
            // A value too small for an eighth is one, a thin line, so it reads as small, not none
            return [{ color: s.color, from, to: v > 0 ? Math.max(from + 1, heightOf(min + sum)) : heightOf(min + sum) }]
        }).filter(g => g.to > g.from)
    })
    return Array.from({ length: rows }, (_, r) => points.map((_, c) => {
        const only = points[c].only
        if (only === -1 || (only === undefined && parted(c))) return { text: null, color: null }
        const bottom = (rows - 1 - r) * 8
        if (stacked) {
            const at = (h) => segments[c].find(g => g.from <= h && h < g.to)
            const own = at(bottom)
            if (!own) return { text: null, color: null }
            const fill = Math.min(8, own.to - bottom)
            const next = fill < 8 ? at(bottom + fill) : null
            return { text: EIGHTHS[fill], color: own.color, bg: next?.color ?? null }
        }
        const fills = series.flatMap((s, k) => s.points[c].mean === null || (only !== undefined && only !== k) ? [] : [{ color: s.color, value: s.points[c].mean, fill: Math.max(bottom === 0 && s.points[c].mean > min ? 1 : 0, Math.min(8, heightOf(s.points[c].mean) - bottom)) }])
            .filter(f => f.fill > 0)
        const whole = fills.filter(f => f.fill === 8).sort((a, b) => a.value - b.value)[0]
        const top = whole ?? fills.sort((a, b) => b.fill - a.fill)[0]
        return top ? { text: EIGHTHS[top.fill], color: top.color } : { text: null, color: null }
    }))
}

// Braille: each cell is a 2 × 4 grid of dots, so a line moves a quarter of a row and half a column at a time
// and reads as a line, not a staircase of box glyphs. Dots by their place in the cell, left column then right
const DOTS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]]

// One grid of braille cells for a panel's series, from their raw samples, columns cells wide: always one line,
// a point per dot column, joined to the next by a straight run. A dot column with more than one sample takes their
// mean, so many samples never pile up into a thick smear; with fewer samples than dot columns, each sample is a
// point at its exact value and the runs between them slope. A dot column with only null samples is a gap: the line
// stops either side. Where two series meet in a cell, the one listed first
// keeps the cell, in its colour, and the other's dots there are left out: it passes behind
const drawBraille = (series, rows, { min, max }, columns) => {
    const width = columns * 2
    const height = rows * 4
    // max and min at the middles of the top and bottom rows, where their gridlines and labels are, between a row's
    // second and third dots; so a line at a label's value runs along its gridline
    const yOf = (v) => Math.max(0, Math.min(height - 1, Math.round(1.5 + ((max - v) / (max - min)) * (height - 4))))
    const cells = Array.from({ length: rows }, () => Array.from({ length: columns }, () => ({ bits: 0, color: null })))
    const lines = series.map(s => {
        const n = s.values.length
        const xOf = (i) => n === 1 ? 0 : Math.round((i * (width - 1)) / (n - 1))
        // The line's points, in order: each dot column's samples averaged, nulls left out
        const points = []
        s.values.forEach((v, i) => {
            const x = xOf(i)
            let p = points[points.length - 1]
            if (!p || p.x !== x) points.push(p = { x, sum: 0, count: 0 })
            if (v !== null) { p.sum += v; p.count += 1 }
        })
        return points
    })
    series.forEach((s, k) => {
        const dot = (x, y) => {
            const cell = cells[Math.floor(y / 4)]?.[Math.floor(x / 2)]
            if (!cell || (cell.color !== null && cell.color !== s.color)) return
            cell.bits |= DOTS[y % 4][x % 2]
            cell.color = s.color
        }
        const line = (x0, y0, x1, y1) => {
            const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
            for (let k = 0; k <= steps; k++) dot(Math.round(x0 + ((x1 - x0) * k) / steps), Math.round(y0 + ((y1 - y0) * k) / steps))
        }
        lines[k].forEach((p, i) => {
            if (!p.count) return
            const prev = lines[k][i - 1]
            const y = yOf(p.sum / p.count)
            if (!prev?.count) dot(p.x, y)
            else line(prev.x, yOf(prev.sum / prev.count), p.x, y)
        })
    })
    return cells.map(row => row.map(({ bits, color }) => bits ? { text: String.fromCharCode(0x2800 + bits), color } : { text: null, color: null }))
}

// One panel: the y axis, then a Text per column whose cells light with their hover group,
// names, values and colours live in the hover card
// scopeOf(c): a column's hover group (toStrokes)
const panel = (series, rows, labelWidth, cells, rng, scale, scopeOf) => {
    const { Box, Text } = el()
    const labels = yLabels(rows, rng, scale)
    const yAxis = Array.from({ length: rows }, (_, r) =>
        r in labels ? `${labels[r].padStart(labelWidth)} ┤` : `${' '.repeat(labelWidth)} │`).join('\n')
    // A dim dashed rule along every labelled row, the lowest too, under the strokes: in a terminal a solid ─ weighs as
    // much as the data
    const grid = (r) => r in labels
    const columns = cells[0].map((_, c) => {
        const scope = scopeOf(c)
        return Text({
            hover: { scope },
            children: cells.flatMap((row, r) => {
                const { text, color, bg } = row[c]
                const cell = text
                    // The hovered column's points light, their colour moved toward the theme's text (highlight).
                    // bg: a stacked bar's next segment, behind the eighth block where this one ends
                    ? Text({ color, ...(bg ? { backgroundColor: bg } : {}), hover: { scope, color: color ? highlight(color) : 'text', bold: true }, children: [text] })
                    : Text({ dimColor: true, children: [grid(r) ? '┄' : ' '] })
                return r === rows - 1 ? [cell] : [cell, '\n']
            }),
        })
    })
    return Box({ flexDirection: 'row', children: [Text({ dimColor: true, children: [yAxis] }), ...columns] })
}

// The x axis: a tick under every column that brightens with its hover group, labels at start, middle and end;
// the end label is the last sample's time, not the start of the last column's bucket
// bars: each tick sits under the middle of its sample's bar (slots), past the empty column that ends it, and its
// label is centred on it
const barOf = (points, c) => {
    let from = c
    let to = c
    while (from > 0 && points[from - 1].index === points[c].index) from--
    while (to < points.length - 1 && points[to + 1].index === points[c].index) to++
    // A group's empty columns, or a lone bar's one, are not the bar's
    if (points[c].only !== undefined) {
        while (to > from && points[to].only === -1) to--
        return { from, to }
    }
    return { from, to: to > from ? to - 1 : to }
}
const ticksOf = (points, bars = false) => {
    const ends = [0, Math.floor((points.length - 1) / 2), points.length - 1]
    if (!bars) return ends
    return ends.map(c => { const { from, to } = barOf(points, c); return Math.floor((from + to) / 2) })
}
export const axisLabels = (points, times, bars = false) => {
    let labels = ''
    for (const col of ticksOf(points, bars)) {
        const last = col === points.length - 1 || (bars && points[col].index === points[points.length - 1].index)
        const i = last ? points[col].end : points[col].index
        const label = times?.[i] ?? `#${i}`
        const at = bars ? Math.max(0, Math.min(points.length - label.length, col - Math.floor(label.length / 2)))
            : last ? col + 1 - label.length : col
        // One blank cell at least between two labels: one that would touch the label before it is left out
        if (!labels || labels.length < at) labels = labels.padEnd(at) + label
    }
    return labels
}
// The time labels' row, after the y axis' gutter. timeLabel, what zone the times are in ('UTC'), sits dim at its
// end, past the last label; it has a row of its own under them when the row can't take it
const timeRows = (points, times, labelWidth, timeLabel, bars = false) => {
    const labels = `${' '.repeat(labelWidth + 2)}${axisLabels(points, times, bars)}`
    if (!timeLabel) return [labels]
    return labels.length + 1 + timeLabel.length <= labelWidth + 2 + points.length + RIGHT_GAP
        ? [`${labels} ${timeLabel}`]
        : [labels, `${' '.repeat(Math.max(0, labelWidth + 2 + points.length - timeLabel.length))}${timeLabel}`]
}
// zero: bars write their 0 on the axis line, where they stand
const xAxis = (points, times, labelWidth, timeLabel, scopeOf, bars = false, zero = false) => {
    const { Box, Text } = el()
    const ticks = ticksOf(points, bars)
    return [
        Box({
            flexDirection: 'row',
            children: [
                Text({ dimColor: true, children: [`${(zero ? '0' : '').padStart(labelWidth)} └`] }),
                ...points.map((_, c) => Text({
                    dimColor: true,
                    hover: { scope: scopeOf(c), dimColor: false, bold: true },
                    children: [ticks.includes(c) ? '┬' : '─'],
                })),
            ],
        }),
        ...timeRows(points, times, labelWidth, timeLabel, bars).map(row => Text({ dimColor: true, children: [row] })),
    ]
}

// The card a column reveals: its time, then every series' value there, beside the column so it hides none of it.
// Always inside the chart: beside the column on the side with room, else on the other, else as far over as it
// fits. At most half the chart wide (24 cells on a narrow one), so the chart stays in view: a name too long for
// it is shortened with an ellipsis in the middle, where two services' names differ least.
// The cards' width, their values' width, and where each column's card sits (leftOf)
const cardLayout = (series, times, labelWidth) => {
    const nameWidth = Math.max(...series.map(s => s.name.length))
    const valueWidth = Math.max(...series.flatMap(s => s.points.map(p => valueOf(p, s.scale, s.span).length)))
    const columns = series[0].points.length
    // The chart's width: the y axis, its two cells, then the plot
    const chart = labelWidth + 2 + columns
    const width = Math.min(chart, Math.max(24, Math.floor(chart / 2)), Math.max(nameWidth + valueWidth + 8, ...series[0].points.map(p => timeOf(p, times).length + 4)))
    const leftOf = (c) => {
        const right = labelWidth + c + 4
        const left = labelWidth + c - width
        const fitsRight = right + width <= chart
        const fitsLeft = left >= 0
        const at = c < columns / 2 ? (fitsRight || !fitsLeft ? right : left) : (fitsLeft || !fitsRight ? left : right)
        return Math.max(0, Math.min(chart - width, at))
    }
    return { width, valueWidth, leftOf }
}

// top: the row the plot starts on, under the unit if there is one
// A bar's columns share one card, from its first column (scopeOf)
const cards = (series, times, labelWidth, top, scopeOf) => {
    const { Box, Text } = el()
    const { width, valueWidth, leftOf } = cardLayout(series, times, labelWidth)
    return series[0].points.flatMap((p, c) => c > 0 && scopeOf(c) === scopeOf(c - 1) ? [] : [Box({
        position: 'absolute',
        top: top + 1,
        left: leftOf(c),
        display: 'none',
        hover: { scope: scopeOf(c), display: 'flex' },
        flexDirection: 'column',
        width,
        borderStyle: 'round',
        borderDimColor: true,
        // A solid fill so the strokes under the card don't show through; inverseText is the theme's
        // own ground colour (near black on a dark theme, near white on a light one)
        backgroundColor: 'inverseText',
        paddingX: 1,
        children: [
            // Over the values, right-aligned as they are: with dots, each sample's time over its value
            Box({ flexDirection: 'row', justifyContent: 'flex-end', children: [Text({ dimColor: true, wrap: 'truncate-end', children: [timeOf(p, times)] })] }),
            ...series.map(s => Box({
                flexDirection: 'row',
                columnGap: 1,
                children: [
                    Text({ color: s.color, children: ['━'] }),
                    // The name gives way first, shortened; the value keeps its width
                    Box({ flexGrow: 1, flexShrink: 1, children: [Text({ dimColor: true, wrap: 'truncate-middle', children: [s.name] })] }),
                    Box({ flexShrink: 0, children: [Text({ bold: true, dimColor: s.points[c].mean === null, children: [valueOf(s.points[c], s.scale, s.span).padStart(valueWidth)] })] }),
                ],
            })),
        ],
    })])
}

// Spread points over more columns than there are samples, so a short series fills a wide chart. Every sample
// gets a column of its own, drawn at its exact value, so no spike or dip is shaved off; the columns between two
// samples run straight from one to the next, and their cards show the sample nearest them. Never a made-up
// value in a card or on the axis: the axis spans the samples, and a gap stays a gap
// Bars spread out differently: every sample one bar, all as wide (the columns they share, whole), so no bar is
// slimmer than the next and none stands for a time between two samples
const slots = (points, columns) => points.flatMap(p => Array(Math.floor(columns / points.length)).fill(p))
// Grouped bars, several series not stacked: a group a time window, a bar per series side by side in it (only, the
// series drawn in that column), then an empty column (only -1) before the next group. As many windows as groups
// fit the columns, the samples folded into them; each bar as wide as the room allows
const GROUP_GAP = 2
// How many samples a bar folds: the fewest that let every bar fit, rounded up to 1, 2, 3, 4, 6 or a multiple of 12,
// so the windows keep to the clock (with 5-minute samples: 5, 10, 15, 20, 30 minutes, an hour, ...): a time is one
// bar, never several bars side by side of the same hour and much the same value
const clustered = (samples, bars) => {
    const need = Math.ceil(samples / Math.max(1, bars))
    return need <= 4 ? need : need <= 6 ? 6 : Math.ceil(need / 12) * 12
}
// The narrowest a lone bar is, before the empty column after it
const BAR_WIDTH = 2
const groupsOf = (series, columns) => {
    const n = series.length
    const samples = series[0].values.length
    const size = clustered(samples, Math.floor(columns / (n + GROUP_GAP)))
    const folded = series.map(s => bucket(s.values, size))
    const windows = folded[0].length
    const bar = Math.max(1, Math.floor((Math.floor(columns / windows) - GROUP_GAP) / n))
    return folded.map(points => points.flatMap(p => [
        ...series.flatMap((_, k) => Array(bar).fill({ ...p, only: k })),
        ...Array(GROUP_GAP).fill({ ...p, only: -1 }),
    ]))
}
const stretch = (points, columns) => {
    const at = points.map((_, i) => Math.round((i * (columns - 1)) / (points.length - 1)))
    return Array.from({ length: columns }, (_, c) => {
        const i = Math.max(0, at.findLastIndex(x => x <= c))
        const p = points[i]
        if (at[i] === c || i === points.length - 1) return p
        const q = points[i + 1]
        const f = (c - at[i]) / (at[i + 1] - at[i])
        const near = f < 0.5 ? p : q
        const v = p.mean === null || q.mean === null ? null : p.mean + (q.mean - p.mean) * f
        return { index: near.index, end: near.end, min: near.min, max: near.max, line: v, mean: near.mean }
    })
}

// The plain-data series in, what the chart draws out, as wide as the samples need (a column each, MAX_COLUMNS at
// most), or told its width, as wide as that: folding samples into columns, or spreading them out.
// The panels (each its series and grid of cells), each panel's range and unit scale, the columns' points, the y
// labels' width, and the unit as each panel writes it (units.js: ms, GB, K/s)
export const toScene = (series, { unit = '', palette = 'auto', overlap = 'first', lineType = 'box', stacked = true, multiples = true, times }, width = 0) => {
    const coloured = series.map(s => ({ ...s, color: s.color ?? getColor(palette, s.name, s.attributes) }))
    const bars = lineType === 'bars'
    const raw = coloured.map(s => ({ ...s, points: bucket(s.values, 1) }))
    // Stacked bars share one panel, whatever their sizes: a stack is the sum of them all. Grouped bars too: a group
    // is its series read against each other
    const stack = bars && stacked
    const grouped = bars && !stacked && series.length > 1
    const shared = stack || grouped || !multiples || (series.length <= MAX_SHARED && !flattens(raw, ROWS))
    const rows = shared ? (bars ? BAR_ROWS : ROWS) : MULTIPLE_ROWS
    // The y labels don't change with the columns: a bucket keeps its samples' low and high. A stack's axis reaches
    // its tallest column's sum
    const panelsOf = (all) => shared ? [all] : all.map(s => [s])
    const sums = (p) => [{ points: bucket(p[0].values.map((_, i) => p.reduce((a, s) => a + (s.values[i] ?? 0), 0)), 1) }]
    const exact = panelsOf(raw).map(p => range(stack ? sums(p) : p, bars))
    const ranges = exact.map(nice)
    // The scale from the largest value, not the rounded axis, so 698 ms stays ms on an axis to 1000. Time, bytes and
    // percent take one scale across every panel, so a card's values share a unit (UNIT-002); counts one a panel
    const largest = (r) => Math.max(Math.abs(r.min), Math.abs(r.max))
    const scales = sharesScale(unit)
        ? exact.map(() => scaleFor(unit, Math.max(...exact.map(largest))))
        : exact.map(r => scaleFor(unit, largest(r)))
    const units = scales.map(sc => sc.suffix.trim())
    // Bars on BarChart's scale, 0 on the axis, when no value is under zero
    const barred = bars ? exact.map((r, i) => barScale(rows, r, scales[i])) : []
    const zero = bars && barred.every(Boolean)
    if (zero) barred.forEach((r, i) => { ranges[i] = r })
    const labelWidth = Math.max(shared ? units[0].length : 0, ...ranges.flatMap((r, i) => Object.values(yLabels(rows, r, scales[i])).map(l => l.length)))
    const samples = series[0].values.length
    const columns = width ? Math.max(2, width - labelWidth - 2 - RIGHT_GAP) : Math.min(samples, MAX_COLUMNS)
    // Bars cluster their samples (clustered), so each is BAR_WIDTH columns at least, an empty one after it
    const size = bars ? clustered(samples, Math.floor(columns / (BAR_WIDTH + 1))) : Math.ceil(samples / columns)
    const groups = grouped ? groupsOf(coloured, width ? columns : MAX_COLUMNS) : null
    const bucketed = coloured.map((s, k) => {
        if (groups) return { ...s, points: groups[k] }
        const points = bucket(s.values, size)
        return { ...s, points: width && points.length > 1 && points.length < columns ? (bars ? slots : stretch)(points, columns) : points }
    })
    const panels = panelsOf(bucketed)
    // A row's worth of value on each series' panel: how far past its line a column must reach for its card to mark it
    panels.forEach((p, i) => {
        const { min, max } = ranges[i]
        for (const s of p) { s.span = (max - min) / (rows - 1); s.scale = scales[i] }
    })
    // Dots draw the samples themselves (drawBraille): a cell's card shows each sample in it, its time over its
    // value, as a table, not their mean, so the card reads what the dots draw. Past four samples a cell, it shows
    // each dot column's instead, the mean of the samples that column draws
    if (lineType === 'braille' && width) {
        const cells = bucketed[0].points.length
        const xOf = (i) => samples === 1 ? 0 : Math.round((i * (cells * 2 - 1)) / (samples - 1))
        const dotsOf = (values) => {
            const at = Array.from({ length: cells }, () => [])
            values.forEach((v, i) => {
                const x = xOf(i)
                const cell = at[Math.floor(x / 2)]
                const last = cell[cell.length - 1]
                if (last && last.x === x) { last.end = i; if (v !== null) { last.sum += v; last.count++ } }
                else cell.push({ x, index: i, end: i, sum: v ?? 0, count: v === null ? 0 : 1 })
            })
            return at.map(cell => cell[cell.length - 1]?.end - cell[0]?.index < 4
                ? Array.from({ length: cell.length ? cell[cell.length - 1].end - cell[0].index + 1 : 0 }, (_, k) => ({ index: cell[0].index + k, end: cell[0].index + k, mean: values[cell[0].index + k] }))
                : cell.map(d => ({ index: d.index, end: d.end, mean: d.count ? d.sum / d.count : null })))
        }
        const dotted = bucketed.map(s => dotsOf(s.values))
        const widest = Math.max(...bucketed.flatMap((s, k) => dotted[k].flat().map(d => d.mean === null ? 4 : formatValue(d.mean, '', s.scale).length)),
            ...dotted[0].flat().map(d => (d.index === d.end ? times?.[d.index] ?? `#${d.index}` : `${times?.[d.index]}–${times?.[d.end]}`).length))
        bucketed.forEach((s, k) => s.points.forEach((p, c) => {
            if (dotted[k][c].length) s.points[c] = { ...p, dots: dotted[k][c], dotWidth: widest }
        }))
    }
    // Box glyphs: a cell's strokes as one glyph, uncoloured where two series merge
    const boxCells = (p) => draw(p, rows, ranges[panels.indexOf(p)], overlap).map(row => row.map(({ sides, color, overlap: merged }) =>
        sides ? { text: glyph(sides), color: merged ? undefined : color } : { text: null, color: null }))
    const grids = panels.map((p, i) => bars ? drawBars(p, rows, ranges[i], stack)
        : lineType === 'box' ? boxCells(p) : drawBraille(p, rows, ranges[i], bucketed[0].points.length))
    return { shared, rows, labelWidth, bucketed, panels, grids, ranges, scales, units, bars, zero }
}

// Under a shared panel, which colour is which series (Legend); small multiples name theirs over each panel
// It starts under the plot, past the y axis; with no names there is nothing to say
const legendOf = ({ shared, bucketed, bars, labelWidth }) => shared && bucketed.some(s => s.name)
    ? [el().Box({ paddingLeft: labelWidth + 2, children: [Legend({ items: bucketed.map(s => ({ name: s.name, color: s.color })), swatch: bars ? '█' : '━' })] })]
    : []

// The unit above a shared panel's y axis, when it has one
const unitAbove = ({ shared, units }) => shared && units[0] ? units[0] : ''

// The chart drawn as elements of this render: hover lights a column and shows its card, with no hook running
// id: the chart's own hover groups (hoverIdOf), so hovering it lights nothing in another chart
const toStrokes = (scene, { times, timeLabel, id }) => {
    const { shared, rows, labelWidth, bucketed, panels, grids, ranges, scales, units } = scene
    const { Box, Text } = el()
    const above = unitAbove(scene)
    // Hover groups: a column each, or for bars every column of a sample, so a bar, or a group of bars, lights whole
    const points = bucketed[0].points
    const scopeOf = (c) => `${id}-${scene.bars ? points[c].index : c}`
    return Box({
        flexDirection: 'column',
        children: [
            // The unit, once, above the y axis: the panel's series share it
            ...(above ? [Text({ dimColor: true, children: [above.padStart(labelWidth)] })] : []),
            // Small multiples: each panel has its own y axis and scale, so each is headed by its series' name and
            // unit, a blank row above it, so one panel's labels never read as the next one's axis
            ...panels.flatMap((p, i) => shared ? [panel(p, rows, labelWidth, grids[i], ranges[i], scales[i], scopeOf)] : [
                Box({ flexDirection: 'row', marginTop: i ? 1 : 0, children: [
                    Text({ children: [' '.repeat(labelWidth + 2)] }),
                    Text({ color: p[0].color, children: ['━ '] }),
                    Text({ dimColor: true, wrap: 'truncate-middle', children: [p[0].name + (units[i] ? ` · ${units[i]}` : '')] }),
                ] }),
                panel(p, rows, labelWidth, grids[i], ranges[i], scales[i], scopeOf),
            ]),
            ...xAxis(points, times, labelWidth, timeLabel, scopeOf, scene.bars, scene.zero),
            ...cards(bucketed, times, labelWidth, above ? 1 : 0, scopeOf),
        ],
    })
}

// The chart as plain data for timeseries.client.js, which draws it and answers the pointer itself: each panel's
// y axis and its cells, a row a string, their colours as indices into palette (-1 none, -2 two series merged);
// the time axis; and each column's card, its values and where it sits
const forClient = (scene, { times, timeLabel }) => {
    const { shared, rows, labelWidth, bucketed, panels, grids, ranges, scales, units } = scene
    const palette = []
    const colorOf = (c) => {
        if (c === undefined) return -2
        if (c === null) return -1
        if (!palette.includes(c)) palette.push(c)
        return palette.indexOf(c)
    }
    const points = bucketed[0].points
    const { width, valueWidth, leftOf } = cardLayout(bucketed, times, labelWidth)
    return {
        offset: labelWidth + 2,
        labelWidth,
        // What the time axis starts with: bars' 0 where they stand
        base: `${(scene.zero ? '0' : '').padStart(labelWidth)} └`,
        unit: unitAbove(scene),
        columns: points.length,
        panels: panels.map((p, i) => {
            const labels = yLabels(rows, ranges[i], scales[i])
            return {
                head: shared ? null : { name: p[0].name + (units[i] ? ` · ${units[i]}` : ''), color: colorOf(p[0].color) },
                axis: Array.from({ length: rows }, (_, r) => r in labels ? `${labels[r].padStart(labelWidth)} ┤` : `${' '.repeat(labelWidth)} │`),
                grid: Array.from({ length: rows }, (_, r) => r in labels),
                text: grids[i].map(row => row.map(cell => cell.text ?? ' ').join('')),
                color: grids[i].map(row => row.map(cell => cell.text ? colorOf(cell.color) : -1)),
                // A stacked bar's next segment, behind an eighth block, or -1
                bg: grids[i].map(row => row.map(cell => cell.text && cell.bg ? colorOf(cell.bg) : -1)),
            }
        }),
        ticks: ticksOf(points, scene.bars),
        // For bars, each column's sample: hovering one lights every column of it, a whole bar or group
        group: scene.bars ? points.map(p => p.index) : null,
        // The time labels' rows, each whole, past the y axis' gutter
        labels: timeRows(points, times, labelWidth, timeLabel, scene.bars),
        card: { width, valueWidth, left: points.map((_, c) => leftOf(c)) },
        series: bucketed.map(s => ({ name: s.name, color: colorOf(s.color) })),
        values: points.map((p, c) => ({
            time: timeOf(p, times),
            values: bucketed.map(s => valueOf(s.points[c], s.scale, s.span)),
            none: bucketed.map(s => s.points[c].mean === null),
        })),
        palette,
        // Each palette colour as a hovered point draws it (highlight)
        lit: palette.map(c => highlight(c)),
    }
}

// series: [{ name, values: numbers in time order, null where there is no sample, attributes: its labels }],
// all the same length; the color manager picks their colours
// times: a label per value; palette: a Dash0 named palette
// unit: a unit that scales to the values' size (units.js: 'bytes', 'seconds', 'milliseconds' or 'ms', 'percent',
// 'ratio', 'decimal'), or any other text written after the number ('/s', 'spans'). One scale a panel: the axis
// writes numbers, the unit above it (850 μs, 1.2 GB, 12.5K/s); the card writes each value with its unit
// The chart fills the width of the Box it sits in, as measured (measure.js): folding samples into columns when
// there are more than fit, spreading them out when there are fewer. Unmeasured (mobile), as wide as its samples

// lineType: 'braille', one line of dots, a quarter row fine; 'box', box-drawing glyphs a row at a time; or 'bars',
// a bar a column from zero, in eighths of a row (drawBars). Each draws a column's samples at their mean; where its
// high or low is more than a row away, the column's hover card marks them ▲ and ▼
// Bars: one series is a bar a time, all as wide as each other with a column between them. Several are grouped
// (groupsOf): a window of time each group, a bar per series side by side; or stacked one on another, one bar a
// time (Dash0's display for counts, such as ERROR on OK)
// legend: which colour is which series, under the chart (Legend); small multiples name each panel instead
// timeLabel: what zone the times are in, such as 'UTC', drawn dim at the end of the time axis. The chart writes
// times as given
// overlap, for box strokes: where lines cross, 'first' draws the first-listed series over the others, which break
// there; 'merge' draws both strokes as one uncoloured glyph. Braille always draws the first series over the others
// onZoom({ start, end, from, to }): with it, the chart answers the pointer itself (timeseries.client.js): dragging
// across the plot runs it with the first and last sample covered, by index and time. The chart changes nothing
// itself: the page queries that span and draws the chart again, as with ChartCard's ranges. No zoom on mobile
// onHover({ start, end, from, to } or null): the samples under the pointer, as it moves over the plot, and null
// when it leaves; for zooming around that point. It runs on every move and draws nothing again
// onZoomIn, onZoomOut, onZoomReset: i and o (or + and −), and r, pressed while the chart has the focus, after a click
// on it: the chart takes the keys then, so a card's Reset zoom hears r through it
// controls (true by default): the chart draws its own Dots / Lines / Bars switch and − + zoom above it and keeps
// what the person picks, by its key (chart-state.js): lineType is then where it starts; − and + halve and double
// the span shown around its middle, Reset zoom shows it all. Drag-to-zoom stays a page's to wire (onZoom).
// A page that wires its own controls (ChartCard's, with onZoom) passes controls={false}, or an onZoom of its own
// multiples (true by default): false keeps every series on one axis, however many or however far apart, with a
// legend under it, as quantiles read best: their lines are one distribution, read against each other
export function Timeseries(props) {
    const { series, times, lineType = 'box', controls = true, onZoom } = props
    if (!controls || onZoom) return drawTimeseries(props)
    const { Box } = el()
    const key = keyFor('timeseries-view', series.map(s => s.name).join(','))
    const view = chartStateOf(key)
    const length = Math.max(0, ...series.map(s => s.values.length))
    // The window shown: [first, last] sample, whole when not zoomed
    const [a, b] = view.window ?? [0, length - 1]
    const slice = (values) => values.slice(a, b + 1)
    const shown = series.map(s => ({ ...s, values: slice(s.values) }))
    const shownTimes = times ? slice(times) : times
    const zoomTo = (from, to) => {
        const lo = Math.max(0, from)
        const hi = Math.min(length - 1, to)
        setChartState(key, { window: lo <= 0 && hi >= length - 1 ? null : [lo, hi] })
    }
    // − and + around the middle of what shows, never under two samples
    const zoomBy = (factor) => {
        const middle = (a + b) / 2
        const half = Math.max(1, Math.round(((b - a) * factor) / 2))
        zoomTo(Math.round(middle - half), Math.round(middle + half))
    }
    const type = view.lineType ?? lineType
    return Box({
        flexDirection: 'column',
        gap: 1,
        children: [
            ChartControls({
                lineType: type,
                onLineTypeChange: (next) => setChartState(key, { lineType: next }),
                ranges: [],
                zoom: view.window ? `${times?.[a] ?? `#${a}`}–${times?.[b] ?? `#${b}`}` : undefined,
                onZoomReset: () => setChartState(key, { window: null }),
                addZoomControl: length > 2,
                onZoomIn: () => zoomBy(0.5),
                onZoomOut: () => zoomBy(2),
                hotkeys: holdsKeys(key),
            }),
            drawTimeseries({
                ...props,
                series: shown,
                times: shownTimes,
                lineType: type,
            }),
        ],
    })
}

function drawTimeseries({ series, times, unit = '', palette = 'auto', overlap = 'first', lineType = 'box', stacked = false, legend = true, timeLabel, multiples = true, onZoom, onHover, onZoomIn, onZoomOut, onZoomReset }) {
    const { Box, Client } = el()
    const key = keyFor('timeseries', series.map(s => s.name).join(','))
    const scene = toScene(series, { unit, palette, overlap, lineType, stacked, multiples, times }, widthOf(key))
    const under = legend ? legendOf(scene) : []
    if (!onZoom || surface() === 'mobile') {
        const id = hoverIdOf(key, JSON.stringify([times, series.map(s => s.values)]))
        return Box({ flexDirection: 'column', children: [measure(key), toStrokes(scene, { times, timeLabel, id }), ...under] })
    }
    const points = scene.bucketed[0].points
    const span = (a, b) => ({ start: points[a].index, end: points[b].end, from: times?.[points[a].index] ?? `#${points[a].index}`, to: times?.[points[b].end] ?? `#${points[b].end}` })
    listen(key, {
        select: (a, b) => {
            const picked = span(a, b)
            if (picked.end > picked.start) onZoom(picked)
        },
        hover: (c) => onHover?.(c === null || !points[c] ? null : span(c, c)),
        zoom: (direction) => ({ in: onZoomIn, out: onZoomOut, reset: onZoomReset })[direction]?.(),
    })
    const chart = Client({ key, module: './timeseries.client.js', width: '100%', props: forClient(scene, { times, timeLabel }) })
    return under.length ? Box({ flexDirection: 'column', children: [chart, ...under] }) : chart
}
