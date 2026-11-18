import { el } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'
import { measure, widthOf, keyFor } from '../../measure.js'
import { EmptyState } from '../empty-state/empty-state.jsx'
import { renderMermaidAscii } from '../../../vendor/mermaid-text/mermaid-text.js'

// Past this much source the layout's path search gets slow: such a diagram is better split
const MAX_LINES = 80
const MAX_SOURCE = 8000

// The kinds drawn here, by their first word. xychart, pie and gantt aren't: BarChart, PieChart and GanttChart draw
// those from data, in the chart palette, with hover cards
const SUPPORTED = /^(flowchart|graph|statediagram(-v2)?|sequencediagram|classdiagram)$/i
const CHARTS = { xychart: 'BarChart or Timeseries', 'xychart-beta': 'BarChart or Timeseries', pie: 'PieChart', gantt: 'GanttChart' }
const kindOf = (source) => source.replace(/^(\s*%%[^\n]*\n)+/, '').trim().split(/\s/)[0] ?? ''

const INLINE_TAG = /<\/?(?:b|i|u|s|em|strong|del|code|small|sub|sup|span|mark)\b[^<>\n]*>/gi
const SIDEWAYS = /^(\s*(?:flowchart|graph)[ \t]+)(LR|RL)\b/

// The source as the renderer reads it: comments out, and a space between an arrow and its |label| closed up
const prepared = (source) => source.replace(/^(\s*%%[^\n]*\n)+/, '').replace(/(-->|-\.->|==>|---|-\.-|===)[ \t]+\|/g, '$1|')

// Each source drawn once: the path search is the slow part, and a pane draws again on every hover.
// The art with its trailing spaces cut, ▶ ◀ as ► ◄, and rows holding nothing but the lines' │ dropped; null when
// the renderer can't read it
const drawings = new Map()
const draw = (source) => {
    if (!drawings.has(source)) {
        if (drawings.size > 64) drawings.clear()
        let art = null
        try {
            art = renderMermaidAscii(prepared(source), { colorMode: 'none', paddingX: 3, paddingY: 1 })
                .replace(/[ \t]+$/gm, '').trimEnd().replace(/▶/g, '►').replace(/◀/g, '◄')
                .split('\n').filter(l => !/^[\s│|]*$/.test(l)).join('\n')
        } catch {
            art = null
        }
        drawings.set(source, art)
    }
    return drawings.get(source)
}
const artWidth = (art) => Math.max(...art.split('\n').map(l => [...l].length))

// Edge labels cut to max, so a diagram too wide for its Box can be drawn again narrower
const EDGE_LABEL = /(-[-.=]+\s*)"([^"\n]+)"(\s*[-.=]+>)|\|([^|\n]+)\|/g
const cap = (label, max) => {
    const flat = label.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()
    return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}
const shortenEdgeLabels = (source, max) =>
    source.replace(EDGE_LABEL, (_, open, quoted, close, piped) => quoted !== undefined ? `${open}"${cap(quoted, max)}"${close}` : `|${cap(piped, max)}|`)

// The ways tried, as drawn, until one fits the width: as written, then a left-to-right flowchart turned top-down,
// then each with its edge labels cut to 24 and to 12
const layouts = (source) => [Infinity, 24, 12].flatMap(max => {
    const text = max === Infinity ? source : shortenEdgeLabels(source, max)
    return SIDEWAYS.test(text) ? [text, text.replace(SIDEWAYS, '$1TD')] : [text]
})

// What each glyph is: a box's outline (found as a closed rectangle), an arrowhead, a line, or text.
// Boxes in the theme's text, so they read as the things; the lines between them dim, so they read as links, not
// boxes; arrowheads in Dash0's primary purple (cta), the one accent, so each link's direction shows at a glance
const LINE = /[─-╿◇▏]/
const ARROW = /[►◄▲▼△▽◁▷]/
const paint = (art) => {
    const grid = art.split('\n').map(l => [...l])
    const cell = (r, c) => grid[r]?.[c] ?? ''
    const box = grid.map(row => row.map(() => false))
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (!/[┌╭╔◇●]/.test(cell(r, c))) continue
            let c2 = c + 1
            while (/[─═┬┴┼▲▼]/.test(cell(r, c2))) c2++
            if (!/[┐╮╗◇●]/.test(cell(r, c2)) || c2 === c + 1) continue
            let r2 = r + 1
            while (/[│║├┤┼►◄]/.test(cell(r2, c))) r2++
            if (!/[└╰╚◇●]/.test(cell(r2, c)) || !/[┘╯╝◇●]/.test(cell(r2, c2))) continue
            for (let y = r; y <= r2; y++) for (let x = c; x <= c2; x++) if (y === r || y === r2 || x === c || x === c2) box[y][x] = true
        }
    }
    const roleOf = (r, c) => {
        const ch = cell(r, c)
        if (!ch.trim()) return 'space'
        if (ARROW.test(ch)) return 'arrow'
        if (box[r][c]) return 'box'
        if (LINE.test(ch)) return 'line'
        return 'text'
    }
    // Each line as runs of one role: [{ role, text }]
    return grid.map((row, r) => row.reduce((runs, ch, c) => {
        const role = roleOf(r, c) === 'space' ? runs[runs.length - 1]?.role ?? 'text' : roleOf(r, c)
        const last = runs[runs.length - 1]
        if (last && last.role === role) last.text += ch
        else runs.push({ role, text: ch })
        return runs
    }, []))
}
const styleOf = (role) => role === 'arrow' ? { color: status('cta').inline } : role === 'line' ? { dimColor: true } : {}

// A Mermaid diagram drawn as boxes and arrows in box-drawing glyphs: a flowchart (graph TD or LR, decisions with ◇
// corners, edge labels on the lines), a sequence, state or class diagram, laid out by the Mermaid text renderer in
// vendor/mermaid-text. Boxes and labels in the theme's text, links dim, arrowheads in Dash0's primary purple.
// It fits the Box it sits in where it can: told its width (measure.js), it turns a left-to-right flowchart top-down,
// then cuts its edge labels; still too wide, it is cut at the Box's edge, with a note saying so. Source it can't
// draw shows an EmptyState saying why, never an error.
// source: the Mermaid text
export function FlowDiagram({ source = '' }) {
    const ui = el()
    const text = String(source ?? '').replace(INLINE_TAG, '').trim()
    const kind = kindOf(text)
    const problem = !kind ? 'There is no diagram in the source.'
        : CHARTS[kind.toLowerCase()] ? `A ${kind} chart draws with ${CHARTS[kind.toLowerCase()]}, from its data.`
        : !SUPPORTED.test(kind) ? `${kind} diagrams aren't drawn here: flowchart, sequence, state and class diagrams are.`
        : text.length > MAX_SOURCE || text.split('\n').length > MAX_LINES ? 'The diagram is too large to lay out. Split it into smaller ones.'
        : null
    const key = keyFor('flow-diagram', text)
    const room = widthOf(key)
    const drawn = problem ? [] : layouts(text).map(draw).filter(Boolean)
    if (problem || !drawn.length) {
        return <EmptyState variant="error" title="Can't draw this diagram" body={problem ?? 'The renderer couldn\'t read it. Check the diagram\'s Mermaid syntax.'} />
    }
    const narrowest = drawn.reduce((a, d) => artWidth(d) < artWidth(a) ? d : a)
    const art = drawn.find(d => !room || artWidth(d) <= room) ?? narrowest
    const cut = room > 0 && artWidth(art) > room
    return (
        <ui.Box flexDirection="column" overflow="hidden">
            {measure(key)}
            {paint(art).map(runs => (
                // Each run its own Text in a row, never squeezed, so a line never wraps onto a second one
                <ui.Box flexDirection="row" flexShrink={0} alignSelf="flex-start">
                    {runs.length ? runs.map(r => <ui.Text {...styleOf(r.role)}>{r.text}</ui.Text>) : <ui.Text> </ui.Text>}
                </ui.Box>
            ))}
            {cut ? <ui.Text dimColor wrap="wrap">{`The diagram is ${artWidth(art)} columns wide, the Box ${room}: cut at the right.`}</ui.Text> : null}
        </ui.Box>
    )
}
