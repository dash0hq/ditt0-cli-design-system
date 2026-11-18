import { el } from '../../../elements.js'
import { measure, widthOf, keyFor } from '../../../measure.js'
import { status } from '../../../foundations/tokens/tokens.js'
import { formatValue } from '../../../foundations/units/units.js'
import { Legend } from '../../../atoms/legend/legend.jsx'

// A cell's shade, faint to full: how many spans fell in it, on a log scale, so one span and a hundred thousand both
// read. SHADES[0] is an empty cell
export const SHADES = [' ', '░', '▒', '▓', '█']
// The widest a column is drawn, however wide the chart's Box
const MAX_CELL = 6

// A count's shade, 1 to 4 on a log scale up to max, squared so the busy cells spread over the shades rather than
// all reading full; 0 for none
export const shadeOf = (count, max) => {
    if (!(count > 0) || !(max > 0)) return 0
    const share = Math.log1p(count) / Math.log1p(max)
    return Math.max(1, Math.min(4, 1 + Math.floor(3.999 * share * share)))
}

// Where spans fell, by duration, over time: Dash0's Outliers heatmap. A column per step, a row per duration band
// (the slowest at the top), each cell shaded by how many spans of that band ended in that step. A cell with any
// ERROR span is drawn in the error red, at least half shaded so one failure shows, over the OK and UNSET grey.
// Above it, the range's max and p99; under it, the time axis and a legend with the shade scale.
// times: a label per column; bands: [{ lo }] in seconds, lowest first, the axis labels; ok, error: counts,
// [band][column], ok counting OK and UNSET; max, p99: in seconds, or null; unit: the bands' unit, as units.js
// formats it. The chart fills its Box (measure.js): each column as wide as fits, MAX_CELL at most
export function Heatmap({ times, bands, ok, error, max = null, p99 = null, unit = 'seconds' }) {
    const ui = el()
    const key = keyFor('heatmap', `${bands.length}x${times.length}`)
    const labels = bands.map(b => b.lo ? formatValue(b.lo, unit) : '0')
    const labelWidth = Math.max(...labels.map(l => l.length))
    const measured = widthOf(key)
    const cell = measured ? Math.max(1, Math.min(MAX_CELL, Math.floor((measured - labelWidth - 2) / Math.max(1, times.length)))) : 2
    const top = Math.max(0, ...ok.flatMap((row, b) => row.map((n, c) => n + (error[b]?.[c] ?? 0))))
    const red = status('error').inline
    const grey = status('unknown').inline
    // One row of cells, in runs of one colour, so a row is a few Texts, not one a cell
    const row = (b) => {
        const runs = []
        times.forEach((_, c) => {
            const errors = error[b]?.[c] ?? 0
            const spans = (ok[b]?.[c] ?? 0) + errors
            const shade = errors > 0 ? Math.max(2, shadeOf(spans, top)) : shadeOf(spans, top)
            const color = shade ? errors > 0 ? red : grey : undefined
            // An empty cell is a dim dashed guideline along its band, as the line chart's gridlines
            const text = shade ? SHADES[shade].repeat(cell) : '┄'.repeat(cell)
            const last = runs[runs.length - 1]
            if (last && last.color === color) last.text += text
            else runs.push({ color, text })
        })
        return (
            <ui.Box flexDirection="row">
                <ui.Text dimColor>{`${labels[b].padStart(labelWidth)} ┤`}</ui.Text>
                {runs.map(run => run.color ? <ui.Text color={run.color}>{run.text}</ui.Text> : <ui.Text dimColor>{run.text}</ui.Text>)}
            </ui.Box>
        )
    }
    // The time axis: the first, middle and last column's time, each under its column, the last ending the axis
    const width = times.length * cell
    const axis = Array.from({ length: width }, () => ' ')
    const place = (c, alignEnd) => {
        const label = times[c] ?? ''
        const at = alignEnd ? Math.max(0, (c + 1) * cell - label.length) : c * cell
        if (axis.slice(at, at + label.length).some(ch => ch !== ' ') || at + label.length > width) return
        for (let i = 0; i < label.length; i++) axis[at + i] = label[i]
    }
    if (times.length) {
        place(0, false)
        place(times.length - 1, true)
        place(Math.floor(times.length / 2), false)
    }
    const pad = ' '.repeat(labelWidth + 2)
    return (
        <ui.Box flexDirection="column">
            {measure(key)}
            <ui.Box flexDirection="row" columnGap={1} paddingLeft={labelWidth + 2}>
                <ui.Text dimColor>↓</ui.Text>
                <ui.Text bold>{max === null ? 'no data' : formatValue(max, unit)}</ui.Text>
                <ui.Text dimColor>max</ui.Text>
                <ui.Text> </ui.Text>
                <ui.Text bold>{p99 === null ? 'no data' : formatValue(p99, unit)}</ui.Text>
                <ui.Text dimColor>p99</ui.Text>
            </ui.Box>
            {bands.map((_, i) => row(bands.length - 1 - i))}
            <ui.Text dimColor>{`${' '.repeat(labelWidth + 1)}└${'─'.repeat(width)}`}</ui.Text>
            <ui.Text dimColor>{`${pad}${axis.join('').trimEnd()}`}</ui.Text>
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={2} paddingLeft={labelWidth + 2}>
                <Legend items={[{ name: 'ERROR', color: red }, { name: 'OK & UNSET', color: grey }]} swatch="■" />
                <ui.Box flexDirection="row" columnGap={1}>
                    <ui.Text dimColor># of spans: 0</ui.Text>
                    <ui.Text color={grey}>{SHADES.slice(1).join('')}</ui.Text>
                    <ui.Text dimColor>{formatValue(top, '')}</ui.Text>
                </ui.Box>
            </ui.Box>
        </ui.Box>
    )
}
