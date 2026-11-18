import { el } from '../../elements.js'
import { Button } from '../../atoms/button/button.jsx'

// The time ranges offered when none are given. Any list goes: [{ value, label }]
export const RANGES = [
    { value: '1h', label: '1h' },
    { value: '6h', label: '6h' },
    { value: '24h', label: '24h' },
]

// How a line chart draws its line, each with an icon drawn in that style
export const LINE_TYPES = [
    { value: 'braille', label: '⣀⡠⠊ Dots' },
    { value: 'box', label: '╭─╯ Lines' },
    { value: 'bars', label: '▁▃▅ Bars' },
]

// Which way a bar chart's bars grow, each with an icon of bars that way
export const ORIENTATIONS = [
    { value: 'vertical', label: '▂▅▇ Vertical' },
    { value: 'horizontal', label: '≡ Horizontal' },
]

// A row of bordered toggles, one on: the selected one's border in the accent colour, the others dim
const Toggles = ({ options, value, onChange }) => {
    const ui = el()
    return (
        <ui.Box flexDirection="row" flexWrap="wrap">
            {options.map(option => (
                <Button
                    id={`tab-${option.value}`}
                    label={option.label}
                    selected={option.value === value}
                    onClick={() => onChange?.(option.value)}
                />
            ))}
        </ui.Box>
    )
}

// The controls over a chart, on one line: how it draws (line type for a line chart, orientation for a bar chart),
// its time range, and, for a line chart, zoom. Each shows only when given its value; the page keeps every value
// and draws the chart again, as Tabs leaves the open tab to its caller.
// lineType, onLineTypeChange: 'braille', 'box' or 'bars', a Dots / Lines / Bars toggle
// orientation, onOrientationChange: 'vertical' or 'horizontal', a Vertical / Horizontal toggle
// ranges, range, onRangeChange: [{ value, label }], [] for none, and the selected one's value
// zoom, onZoomReset: while zoomed in, the span shown ('05:00–06:00'), drawn as the selected range in the ranges'
// place, with a Reset zoom button beside it
// addZoomControl, onZoomIn, onZoomOut: − and + at the far right. For a line chart: a bar chart's bars are its
// labels, with nothing between them to zoom into
// hotkeys (true by default): o zooms out, i in, r resets, while the pane has the keyboard. Two charts on one key:
// the later drawn wins, so a page of several gives the keys to one chart at a time (Timeseries: the last one used)
export function ChartControls({ lineType, onLineTypeChange, orientation, onOrientationChange, ranges = RANGES, range, onRangeChange, zoom, onZoomReset, addZoomControl = false, onZoomIn, onZoomOut, hotkeys = true }) {
    const ui = el()
    if (!lineType && !orientation && !ranges.length && !zoom && !addZoomControl) return null
    return (
        <ui.Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" alignItems="center" columnGap={4}>
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={4}>
                {lineType ? <Toggles options={LINE_TYPES} value={lineType} onChange={onLineTypeChange} /> : null}
                {orientation ? <Toggles options={ORIENTATIONS} value={orientation} onChange={onOrientationChange} /> : null}
                {zoom ? (
                    <ui.Box flexDirection="row" columnGap={1}>
                        <Toggles options={[{ value: 'zoom', label: zoom }]} value="zoom" />
                        <Button id="reset-zoom" label="Reset zoom" hotkey={hotkeys ? 'r' : undefined} shortcut onClick={onZoomReset} />
                    </ui.Box>
                ) : ranges.length ? <Toggles options={ranges} value={range} onChange={onRangeChange} /> : null}
            </ui.Box>
            {addZoomControl ? (
                <ui.Box flexDirection="row" columnGap={2}>
                    <Button id="zoom-out" label="−" variant="transparent" hotkey={hotkeys ? 'o' : undefined} shortcut onClick={onZoomOut} />
                    <Button id="zoom-in" label="+" variant="transparent" hotkey={hotkeys ? 'i' : undefined} shortcut onClick={onZoomIn} />
                </ui.Box>
            ) : null}
        </ui.Box>
    )
}
