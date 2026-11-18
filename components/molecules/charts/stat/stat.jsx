import { el } from '../../../elements.js'
import { status } from '../../../foundations/tokens/tokens.js'
import { formatValue } from '../../../foundations/units/units.js'
import { DIGITS, EIGHTHS, SPARK } from './stat.constants.js'

// The digits, the eighths and the sparkline's width are in stat.constants.js, which the Go package reads too

// The status a value reaches: the last threshold at or under it. thresholds: [{ value, color }], color a status
export const thresholdOf = (value, thresholds = []) =>
    [...thresholds].sort((a, b) => a.value - b.value).filter(t => value !== null && value >= t.value).pop()?.color

// The values as one row of eighths, each cell the mean of the values it covers, low to high between their min and
// max; a flat line sits at the middle, a gap stays blank
export const sparkline = (values, width = SPARK) => {
    const cells = Math.min(width, values.length)
    const means = Array.from({ length: cells }, (_, i) => {
        const part = values.slice(Math.floor(i * values.length / cells), Math.floor((i + 1) * values.length / cells)).filter(v => v !== null)
        return part.length ? part.reduce((a, v) => a + v, 0) / part.length : null
    })
    const known = means.filter(v => v !== null)
    const [lo, hi] = [Math.min(...known), Math.max(...known)]
    return means.map(v => v === null ? ' ' : hi === lo ? EIGHTHS[3] : EIGHTHS[Math.round((v - lo) / (hi - lo) * 7)]).join('')
}

// One number that matters, big, with its unit (Dash0's Stat panel): what it counts over it, how it moved since
// before beside it, and the values it came from as a sparkline under it.
// values: the series, oldest first; the stat is the last value that isn't null. value: the stat alone, without a series
// unit: a unit from units.js ('seconds', 'bytes', 'percent', ...) or a string written after the number
// previous: the value to compare with, for ▲ or ▼ and the change; compareLabel names it, 'vs 1h ago'
// goodWhen: 'up' (the default) or 'down', the way the change is good: a latency's ▼ is green, a request rate's ▲ is
// thresholds: [{ value, color }], the value drawn in the status colour of the last threshold it reaches
// size: 'large', digits three rows tall; 'small', one bold line, for a row of stats on a narrow screen
export function Stat({ label, values = [], value, unit = '', previous, compareLabel = 'vs previous', goodWhen = 'up', thresholds = [], size = 'large' }) {
    const ui = el()
    const current = value ?? [...values].reverse().find(v => v !== null && v !== undefined) ?? null
    const text = formatValue(current, unit)
    const color = thresholdOf(current, thresholds)
    const ink = color ? status(color).inline : undefined
    // The number in big digits, its unit and magnitude (ms, K) small on the bottom row beside it
    const [, number, suffix] = current === null ? [null, '', text] : text.match(/^(-?[\d.]+)(.*)$/)
    const big = [0, 1, 2].map(row => [...number].map(ch => DIGITS[ch][row]).join(' '))
    const change = previous !== undefined && previous !== null && current !== null && previous !== 0
        ? (current - previous) / Math.abs(previous) * 100 : null
    const good = change !== null && (goodWhen === 'down' ? change < 0 : change > 0)
    return (
        <ui.Box flexDirection="column">
            {label ? <ui.Text dimColor>{label}</ui.Text> : null}
            {size === 'large' && number ? (
                <ui.Box flexDirection="row" columnGap={1}>
                    <ui.Box flexDirection="column">
                        {big.map(line => <ui.Text color={ink} bold>{line}</ui.Text>)}
                    </ui.Box>
                    <ui.Box flexDirection="column" justifyContent="flex-end">
                        <ui.Text color={ink} bold>{suffix.trim()}</ui.Text>
                    </ui.Box>
                </ui.Box>
            ) : <ui.Text color={ink} bold dimColor={current === null || undefined}>{text}</ui.Text>}
            {change !== null ? (
                <ui.Text>
                    <ui.Text color={change === 0 ? undefined : status(good ? 'healthy' : 'error').inline}>
                        {`${change > 0 ? '▲' : change < 0 ? '▼' : '='} ${formatValue(Math.abs(change), 'percent')}`}
                    </ui.Text>
                    <ui.Text dimColor>{` ${compareLabel}`}</ui.Text>
                </ui.Text>
            ) : null}
            {values.length > 1 ? <ui.Text color={ink} dimColor={!ink || undefined}>{sparkline(values)}</ui.Text> : null}
        </ui.Box>
    )
}
