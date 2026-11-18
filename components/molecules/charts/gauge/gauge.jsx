import { el } from '../../../elements.js'
import { status } from '../../../foundations/tokens/tokens.js'
import { formatValue } from '../../../foundations/units/units.js'

// The status a value reaches: the last threshold at or under it, as Stat's thresholds
const thresholdOf = (value, thresholds) =>
    [...thresholds].sort((a, b) => a.value - b.value).filter(t => value !== null && value >= t.value).pop()?.color

// How full something is between a floor and a ceiling (Dash0's Gauge panel), as a row of squares rather than an arc:
// the filled ones in the colour of the threshold the value reaches, the rest dim, the value and unit after them.
// Under the meter, each threshold's place is ticked in its colour, between the min and max.
// value: the reading; min, max: the ends, 0 and 100 by default; unit: as units.js formats it
// thresholds: [{ value, color }], color a status ('warning', 'error'); without one the filled squares are CTA purple
// width: squares in the meter
export function Gauge({ label, value, min = 0, max = 100, unit = '', thresholds = [], width = 30 }) {
    const ui = el()
    const share = value === null || value === undefined || max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)))
    const filled = Math.round(share * width)
    const color = thresholdOf(value ?? null, thresholds)
    const fill = color ? status(color).inline : status('cta').inline
    // The column a value falls in, for the ticks
    const at = (v) => Math.max(0, Math.min(width - 1, Math.round((v - min) / (max - min) * width) - (v >= max ? 1 : 0)))
    const ticks = Array.from({ length: width }, () => ({ glyph: ' ' }))
    for (const t of thresholds) if (t.value > min && t.value < max) ticks[at(t.value)] = { glyph: '╵', color: status(t.color).inline }
    const [lo, hi] = [formatValue(min, unit), formatValue(max, unit)]
    return (
        <ui.Box flexDirection="column">
            {label ? <ui.Text dimColor>{label}</ui.Text> : null}
            <ui.Box flexDirection="row" columnGap={1}>
                <ui.Text>
                    <ui.Text color={fill}>{'■'.repeat(filled)}</ui.Text>
                    <ui.Text dimColor>{'□'.repeat(width - filled)}</ui.Text>
                </ui.Text>
                <ui.Text color={color ? fill : undefined} bold dimColor={value === null || value === undefined || undefined}>{formatValue(value, unit)}</ui.Text>
            </ui.Box>
            {thresholds.length ? (
                <ui.Text>{ticks.map(t => t.color ? <ui.Text color={t.color}>{t.glyph}</ui.Text> : t.glyph)}</ui.Text>
            ) : null}
            <ui.Text dimColor>{lo + ' '.repeat(Math.max(1, width - lo.length - hi.length)) + hi}</ui.Text>
        </ui.Box>
    )
}
