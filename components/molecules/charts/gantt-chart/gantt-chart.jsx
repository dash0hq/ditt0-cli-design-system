import { el } from '../../../elements.js'
import { measure, widthOf, keyFor, hoverIdOf } from '../../../measure.js'
import { getColor } from '../../../foundations/color-manager/color-manager.js'
import { highlight } from '../../../foundations/tokens/tokens.js'
import { scaleFor, formatValue } from '../../../foundations/units/units.js'

const SECOND = 1000
const MINUTE = 60 * SECOND
const DAY = 86400000
// The steps a tick can mark, shortest first: the first that keeps the labels apart is taken. Under a minute too, so
// a trace's spans tick in milliseconds
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, SECOND, 2 * SECOND, 5 * SECOND, 10 * SECOND, 30 * SECOND,
    ...[1, 5, 15, 30, 60, 120, 360, 720, 1440, 2880, 10080, 20160, 43200, 129600, 525600].map(m => m * MINUTE)]
// The widest a task's name and a section's name run before they are cut with …
const MAX_NAME = 22
const MAX_SECTION = 24
// The track's length: as told by the Box, within these; untold (mobile, before it is measured), the most
const MIN_TRACK = 10
const MAX_TRACK = 60
// A cell filled from the left in eighths, so a bar's end lands between whole cells
const EIGHTHS = ' ▏▎▍▌▋▊▉'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fit = (label, max) => label.length <= max ? label : `${label.slice(0, max - 1).trimEnd()}…`
const pad = (text, size) => text + ' '.repeat(Math.max(0, size - text.length))
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const pad2 = (n) => String(n).padStart(2, '0')
const timeOf = (t) => t instanceof Date ? t.getTime() : typeof t === 'string' ? Date.parse(t) : Number(t)

// How a time is written, by how long the chart spans: under a minute, the time since the first start, in one scale
// for the whole axis (a trace: 0 ms, 100 ms, 200 ms; UNIT-002); under two days, the clock; longer, the day.
// Local time, as Dash0 shows it. at: a card's longer form, with the hour where a day has one
const stampOf = (min, span) => {
    if (span < MINUTE) {
        const scale = scaleFor('ms', span)
        return { tick: (t) => formatValue(t - min, 'ms', scale), at: (t) => `+${formatValue(t - min, 'ms', scale)}` }
    }
    const clock = (t) => { const d = new Date(t); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}` }
    if (span < 2 * DAY) return { tick: clock, at: clock }
    const day = (t) => { const d = new Date(t); return `${MONTHS[d.getMonth()]} ${d.getDate()}` }
    return { tick: day, at: (t) => { const d = new Date(t); return d.getHours() || d.getMinutes() ? `${day(t)} ${clock(t)}` : day(t) } }
}

// A bar from cell `from` to cell `to`, in fractions of cells, as the track's text up to its end: whole cells, a ▐
// where it starts in the middle of a cell, and its end to an eighth of a cell. A bar shorter than a cell is one █
// at fallback, its start's cell, never nothing
const fineBar = (from, to, fallback) => {
    const half = from % 1 >= 0.25 && from % 1 < 0.75
    const start = half ? Math.floor(from) + 1 : Math.round(from)
    const eighths = Math.round(to * 8)
    const whole = Math.floor(eighths / 8) - start
    if (whole < 1) return { at: fallback, text: '█' }
    return { at: start - (half ? 1 : 0), text: (half ? '▐' : '') + '█'.repeat(whole) + (eighths % 8 > 1 ? EIGHTHS[eighths % 8] : '') }
}

// Tasks over time: a row per task, its name at the left and its bar along a time axis, the axis on top, ticked at
// steps that keep its labels apart, with dim guidelines down through the rows. A milestone is a ◆ at its time.
// Sections head their tasks, in the order given, the tasks indented under them. A bar's start lands to half a cell
// and its end to an eighth. Hovering a task lights its name and bar and shows its card: name, start → end, duration.
// tasks: [{ label, section, start, end, milestone, color, series, attributes }]; start and end in ms, a Date or an ISO
// string; a milestone has a start alone. A task without a colour takes the Color Manager's for its series, else its
// section, else its label, as a bar of that name does in any chart; attributes can give it a meaning (an ERROR span)
// The chart fills the width of the Box it sits in (measure.js), its track 10 to 60 cells
export function GanttChart({ tasks = [] }) {
    const ui = el()
    const shown = tasks
        .map(t => {
            const start = timeOf(t.start)
            return { ...t, label: String(t.label ?? ''), start, end: t.milestone ? start : Math.max(start, timeOf(t.end ?? t.start)) }
        })
        .filter(t => Number.isFinite(t.start) && Number.isFinite(t.end))
        .map(t => ({ ...t, color: t.color ?? getColor('auto', t.series ?? t.section ?? t.label, t.attributes) }))
    if (!shown.length) return <ui.Text dimColor>no data</ui.Text>
    // The rows top to bottom: a section's name where the section changes, then its tasks
    const rows = []
    shown.forEach((t, i) => {
        if (t.section && t.section !== shown[i - 1]?.section) rows.push({ section: fit(t.section, MAX_SECTION) })
        rows.push({ task: t, i, name: fit(t.label, MAX_NAME) })
    })
    const indent = shown.some(t => t.section) ? '  ' : ''
    const min = Math.min(...shown.map(t => t.start))
    const max = Math.max(...shown.map(t => t.end))
    const span = max - min || DAY
    const stamp = stampOf(min, span)
    const labelWidth = Math.max(...rows.map(r => r.task ? r.name.length + indent.length : r.section.length))
    const key = keyFor('gantt-chart', JSON.stringify(shown.map(t => [t.label, t.start, t.end])))
    // A cell left empty on the right, so the bars don't run into the edge of what holds them
    const measured = widthOf(key)
    const chart = measured ? clamp(measured - labelWidth - 4, MIN_TRACK, MAX_TRACK) : MAX_TRACK
    const col = (t) => Math.round(((t - min) / span) * chart)
    const tickText = stamp.tick(max).length
    const room = Math.max(1, Math.floor(chart / (tickText + 3)))
    const step = STEPS.find(ms => span / ms <= room) ?? span
    const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => min + i * step)
    const guides = new Set(ticks.map(col))
    // The axis: a tick at each step, its time over it, a label left out where it would run into the one before
    const axis = [...'─'.repeat(chart + 1)]
    const labels = [...' '.repeat(chart + 1)]
    let free = 0
    for (const t of ticks) {
        const at = col(t)
        axis[at] = '┬'
        const text = stamp.tick(t)
        const from = Math.min(at, chart + 1 - text.length)
        if (from < free) continue
        labels.splice(from, text.length, ...text)
        free = from + text.length + 1
    }
    const id = hoverIdOf(key, JSON.stringify(shown.map(t => t.color)))
    const scope = (i) => `${id}-${i}`
    // The track from cell a up to b with nothing on it: its guidelines, else empty
    const track = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, k) => guides.has(a + k) ? '┊' : ' ').join('')
    const markOf = (t) => {
        const a = Math.min(col(t.start), chart - 1)
        return t.milestone ? { at: a, text: '◆' } : fineBar(((t.start - min) / span) * chart, ((t.end - min) / span) * chart, a)
    }
    // A row as wide as its cells, never squeezed, so it never wraps onto a second line
    const line = (cells) => <ui.Box flexDirection="row" flexShrink={0} alignSelf="flex-start">{cells}</ui.Box>
    // Each run its own Text in the row, not nested in one: in the terminal a nested Text lights with its group but the
    // pointer over it never starts the hover, so the card would never show
    const taskRow = ({ task: t, i, name }) => {
        const mark = markOf(t)
        const end = mark.at + mark.text.length
        return line([
            <ui.Text hover={{ scope: scope(i), bold: true }}>{pad(indent + name, labelWidth)}</ui.Text>,
            <ui.Text dimColor>{`  ${track(0, mark.at)}`}</ui.Text>,
            <ui.Text color={t.color} hover={{ scope: scope(i), color: highlight(t.color) }}>{mark.text}</ui.Text>,
            ...(end <= chart ? [<ui.Text dimColor>{track(end, chart + 1)}</ui.Text>] : []),
        ])
    }
    // A card per task, under its row and beside its bar, so it hides none of it; a solid fill so the rows under it
    // don't show through. Near the bottom it moves up to end on the chart's last line, never past it. Drawn last: a
    // later sibling paints over an earlier one
    const height = 2 + rows.length
    const cardOf = ({ task: t, i }, row) => {
        const lines = t.milestone ? [stamp.at(t.start)] : [`${stamp.at(t.start)} → ${stamp.at(t.end)}`, formatValue(t.end - t.start, 'ms')]
        const cardWidth = Math.max(t.label.length + 2, ...lines.map(l => l.length)) + 4
        const mark = markOf(t)
        const after = mark.at + mark.text.length + 1
        const left = labelWidth + 2 + (after + cardWidth <= chart + 1 ? after : mark.at - cardWidth - 1)
        return (
            <ui.Box
                position="absolute"
                top={Math.max(0, Math.min(row + 3, height - (lines.length + 3)))}
                left={Math.max(0, left)}
                display="none"
                hover={{ scope: scope(i), display: 'flex' }}
                flexDirection="column"
                width={cardWidth}
                borderStyle="round"
                borderDimColor
                backgroundColor="inverseText"
                paddingX={1}
            >
                <ui.Text><ui.Text color={t.color}>{t.milestone ? '◆ ' : '■ '}</ui.Text>{t.label}</ui.Text>
                <ui.Text bold>{lines[0]}</ui.Text>
                {lines[1] ? <ui.Text dimColor>{lines[1]}</ui.Text> : null}
            </ui.Box>
        )
    }
    const lead = ' '.repeat(labelWidth + 2)
    return (
        <ui.Box flexDirection="column" overflow="hidden">
            {measure(key)}
            <ui.Text dimColor>{(lead + labels.join('')).trimEnd()}</ui.Text>
            <ui.Text dimColor>{lead + axis.join('')}</ui.Text>
            {rows.map(r => r.task ? taskRow(r) : line([<ui.Text bold>{r.section}</ui.Text>]))}
            {rows.map((r, row) => r.task ? cardOf(r, row) : null)}
        </ui.Box>
    )
}
