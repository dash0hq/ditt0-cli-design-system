import { el } from '../../elements.js'
import { measure, widthOf, keyFor } from '../../measure.js'
import { Badge } from '../../atoms/badge/badge.jsx'
import { markdownTable } from '../../copy.js'
import { CopyButtons } from '../copy-buttons/copy-buttons.jsx'

// A rule as wide as the Box it sits in: a long run of the glyph, clipped to one row
const rule = (glyph) => {
    const { Box, Text } = el()
    return Box({ height: 1, overflow: 'hidden', children: [Text({ dimColor: true, wrap: 'truncate', children: [glyph.repeat(400)] })] })
}

// A cell's text, with `code` drawn in the accent colour, as a doc's markdown writes it
const inline = (text) => {
    const { Text } = el()
    const parts = String(text ?? '').split(/(`[^`]+`)/).filter(Boolean)
    return parts.map(part => part.startsWith('`') && part.endsWith('`') && part.length > 1
        ? Text({ color: 'suggestion', children: [part.slice(1, -1)] })
        : part)
}

// A cell is text, or { text, color, badge } for one that says a state: color, a colour for its text (a status from
// tokens.js, a series colour); badge, a Badge colour, drawn as that Badge
const textOf = (cell) => cell !== null && typeof cell === 'object' ? String(cell.text ?? '') : String(cell ?? '')
const cellOf = (cell, style, wrap) => {
    const { Text } = el()
    if (cell !== null && typeof cell === 'object' && cell.badge) return Badge({ label: cell.text, color: cell.badge })
    const color = cell !== null && typeof cell === 'object' ? cell.color : undefined
    return Text({ ...style, color, wrap: wrap ? 'wrap' : 'truncate-end', children: style.bold || color ? [textOf(cell)] : inline(textOf(cell)) })
}

// Rows under a header, in columns that line up. The header is bold, with a rule under it, so it never reads as a
// row; the body follows. Each column takes a share of the width by how long its longest value is (a long one
// counted as 40), so the table fills the Box it sits in.
// columns: [{ key, label, align: 'left' | 'right' }]; right-align numbers. rows: [{ [key]: cell }], each cell text
// or { text, color, badge }
// wrap: false (the default) cuts a value too long for its column with an ellipsis, so every row is one line and
// the rows scan; true wraps it onto more lines, for prose such as a doc's tables, with a dim rule between rows
// variant: 'minimal' (the default, this look), or 'rules', 'grid' or 'box' (lined, below)
// copy: true adds Copy markdown (a GitHub table) and Copy text (the table as text, at its natural width) under it
export function Table({ columns, rows, wrap = false, variant = 'minimal', copy = false }) {
    const drawn = VARIANTS.includes(variant) ? lined({ columns, rows, wrap, variant }) : minimal({ columns, rows, wrap })
    if (!copy) return drawn
    const { Box } = el()
    const id = keyFor('table-copy', JSON.stringify([columns.map(c => c.label), rows.length]))
    return Box({
        flexDirection: 'column',
        gap: 1,
        children: [drawn, CopyButtons({ markdown: markdownTable(columns, rows), text: tableText({ columns, rows, variant }), id })],
    })
}

// Told its width (measure.js), each column is as wide as its longest value and a space, and the room left is shared
// as the weights share it; too narrow, the short columns stay whole (numbers are never cut) and the long ones shrink
// (columnWidths). Untold (mobile, before it is measured), each column takes its share of the width
const minimal = ({ columns, rows, wrap }) => {
    const { Box } = el()
    const natural = columns.map(c => Math.max(String(c.label).length, ...rows.map(r => textOf(r[c.key]).length + (r[c.key]?.badge ? 2 : 0))))
    const words = columns.map(c => Math.max(String(c.label).length, ...rows.map(r => Math.max(0, ...textOf(r[c.key]).split(/\s+/).map(w => w.length)))))
    const weight = natural.map(n => Math.min(40, n) + 2)
    const total = weight.reduce((a, w) => a + w, 0)
    const key = keyFor('table-minimal', JSON.stringify(columns.map(c => c.label)))
    const room = widthOf(key)
    const fitted = room ? columnWidths(natural, room - 1, 1, words) : null
    const spare = fitted ? Math.max(0, room - fitted.reduce((a, w) => a + w + 1, 0)) : 0
    const extra = fitted ? weight.map(w => Math.floor((w / total) * spare)) : null
    const width = (i) => fitted ? fitted[i] + 1 + extra[i] : `${Math.max(1, Math.floor((weight[i] / total) * 100))}%`
    const line = (cells, style) => Box({
        flexDirection: 'row',
        children: columns.map((c, i) => Box({
            width: width(i),
            paddingRight: 1,
            justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start',
            children: [cellOf(cells[c.key], style, wrap)],
        })),
    })
    const header = Object.fromEntries(columns.map(c => [c.key, c.label]))
    return Box({
        flexDirection: 'column',
        children: [
            measure(key),
            line(header, { bold: true }),
            rule('─'),
            ...rows.flatMap((r, i) => wrap && i ? [rule('┄'), line(r, {})] : [line(r, {})]),
        ],
    })
}

// The lined variants: 'rules', a dim rule under the header and between rows; 'grid', the same with a heavy rule under
// the header and wider gaps; 'box', every cell boxed, a double rule under the header. Their columns are as wide as
// their longest value while the Box has room, and shrink to fit it when it hasn't (columnWidths), so the lines meet
const VARIANTS = ['rules', 'grid', 'box']

// Each column's width, given each one's widest value (natural), the room and the gap between columns: every column
// whole when they fit; else the narrow ones whole and the room left shared by the rest, none narrower than its
// longest word (words) while that fits, then cut down from the widest till the row fits
export const columnWidths = (natural, available, gap, words = []) => {
    const room = Math.max(natural.length, available - gap * (natural.length - 1))
    const total = natural.reduce((a, b) => a + b, 0)
    if (total <= room) return natural
    const minimum = natural.map((w, c) => Math.min(w, Math.max(1, words[c] ?? 1)))
    const widths = natural.map(() => 0)
    let open = natural.map((_, c) => c)
    let left = room
    for (let fixed = [-1]; fixed.length;) {
        const share = Math.floor(left / open.length)
        const claim = (c) => natural[c] <= share ? natural[c] : minimum[c]
        const minimumsFit = open.reduce((a, c) => a + minimum[c], 0) <= left
        const needed = open.reduce((a, c) => a + claim(c), 0)
        fixed = open.filter(c => natural[c] <= share)
        if (minimumsFit && (!fixed.length || needed > left)) fixed = open.filter(c => minimum[c] > share)
        fixed.forEach(c => { widths[c] = claim(c); left -= widths[c] })
        open = open.filter(c => !fixed.includes(c))
    }
    open.forEach((c, i) => { widths[c] = Math.max(1, Math.floor(left / open.length) + (i < left % open.length ? 1 : 0)) })
    while (widths.reduce((a, b) => a + b, 0) > room) {
        const widest = widths.indexOf(Math.max(...widths))
        if (widths[widest] <= 1) break
        widths[widest]--
    }
    return widths
}

// A value's words on lines of at most width, a word longer than that cut into pieces
const wrapText = (text, width) => {
    const lines = []
    let line = ''
    for (const word of text.split(/\s+/).filter(Boolean)) {
        for (const piece of word.match(new RegExp(`.{1,${Math.max(1, width)}}`, 'gu')) ?? []) {
            if (line && line.length + 1 + piece.length <= width) line += ` ${piece}`
            else { if (line) lines.push(line); line = piece }
        }
    }
    return [...lines, line]
}

const lined = ({ columns, rows, wrap, variant }) => {
    const { Box, Text } = el()
    const box = variant === 'box'
    const gap = box ? 0 : variant === 'grid' ? 3 : 2
    const cells = [Object.fromEntries(columns.map(c => [c.key, c.label])), ...rows]
    const natural = columns.map(c => Math.max(...cells.map(r => textOf(r[c.key]).length + (r[c.key]?.badge ? 2 : 0))))
    const words = columns.map(c => Math.max(...cells.map(r => Math.max(0, ...textOf(r[c.key]).split(/\s+/).map(w => w.length)))))
    const key = keyFor('table', JSON.stringify(columns.map(c => c.label)))
    const room = widthOf(key) || Infinity
    const widths = box ? columnWidths(natural, room - 4, 3, words) : columnWidths(natural, room, gap, words)
    const dim = (text) => Text({ dimColor: true, children: [text] })
    const justify = (c) => c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start'
    // A line of cells: in a box, each between dim bars; else the columns a gap apart
    const line = (values, style) => Box({
        flexDirection: 'row',
        flexShrink: 0,
        alignSelf: 'flex-start',
        columnGap: gap,
        children: [
            ...(box ? [dim('│ ')] : []),
            ...columns.flatMap((c, i) => [
                ...(box && i > 0 ? [dim(' │ ')] : []),
                Box({ width: widths[i], flexShrink: 0, justifyContent: justify(c), children: [cellOf(values[c.key], style, false)] }),
            ]),
            ...(box ? [dim(' │')] : []),
        ],
    })
    // A row: one line, its values cut to their columns; wrapped, as many lines as its longest value takes
    const row = (values, style) => {
        if (!wrap) return [line(values, style)]
        const split = columns.map((c, i) => {
            const cell = values[c.key]
            return cell !== null && typeof cell === 'object' ? [cell] : wrapText(textOf(cell), widths[i])
        })
        return Array.from({ length: Math.max(...split.map(l => l.length)) }, (_, k) =>
            line(Object.fromEntries(columns.map((c, i) => [c.key, split[i][k] ?? ''])), style))
    }
    // A rule across the columns: in a box, from edge to edge with its joints; else a run under each column
    const edge = ([left, fill, mid, right]) => dim(left + widths.map(w => fill.repeat(w + 2)).join(mid) + right)
    const rule = (glyph) => Box({ flexDirection: 'row', flexShrink: 0, alignSelf: 'flex-start', columnGap: gap, children: widths.map(w => dim(glyph.repeat(w))) })
    const header = cells[0]
    const children = box
        ? [edge('┌─┬┐'), ...row(header, { bold: true }), edge('╞═╪╡'), ...rows.flatMap((r, i) => [...(i ? [edge('├─┼┤')] : []), ...row(r, {})]), edge('└─┴┘')]
        : [...row(header, { bold: true }), rule(variant === 'grid' ? '━' : '─'), ...rows.flatMap((r, i) => [...(i ? [rule('─')] : []), ...row(r, {})])]
    return Box({ flexDirection: 'column', children: [measure(key), ...children] })
}

// The table as text, for Copy text: every column as wide as its longest value, drawn in the variant's lines.
// `code` loses its backticks, a Badge is its label
const plain = (cell) => textOf(cell).replace(/`([^`]+)`/g, '$1')
export const tableText = ({ columns, rows, variant = 'minimal' }) => {
    const box = variant === 'box'
    const gap = ' '.repeat(box ? 0 : variant === 'grid' ? 3 : 2)
    const cells = [Object.fromEntries(columns.map(c => [c.key, c.label])), ...rows]
    const widths = columns.map(c => Math.max(...cells.map(r => plain(r[c.key]).length)))
    const line = (values) => {
        const parts = columns.map((c, i) => c.align === 'right' ? plain(values[c.key]).padStart(widths[i]) : plain(values[c.key]).padEnd(widths[i]))
        return (box ? `│ ${parts.join(' │ ')} │` : parts.join(gap)).trimEnd()
    }
    const edge = ([left, fill, mid, right]) => left + widths.map(w => fill.repeat(w + 2)).join(mid) + right
    const rule = (glyph) => widths.map(w => glyph.repeat(w)).join(gap)
    const [header, ...body] = cells
    if (box) return [edge('┌─┬┐'), line(header), edge('╞═╪╡'), ...body.flatMap((r, i) => [...(i ? [edge('├─┼┤')] : []), line(r)]), edge('└─┴┘')].join('\n')
    if (VARIANTS.includes(variant)) return [line(header), rule(variant === 'grid' ? '━' : '─'), ...body.flatMap((r, i) => [...(i ? [rule('─')] : []), line(r)])].join('\n')
    return [line(header), '─'.repeat(widths.reduce((a, w) => a + w, 0) + gap.length * (widths.length - 1)), ...body.map(line)].join('\n')
}

// A markdown table's lines, | a | b |, read into columns and rows; null when they aren't one.
// An escaped \| stays in its cell
export const parseTable = (lines) => {
    const split = (line) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'))
    if (lines.length < 2 || !/^\s*\|?\s*:?-{3,}/.test(lines[1])) return null
    const labels = split(lines[0])
    const aligns = split(lines[1]).map(cell => /-:$/.test(cell) ? 'right' : 'left')
    const columns = labels.map((label, i) => ({ key: `c${i}`, label, align: aligns[i] }))
    const rows = lines.slice(2).map(line => Object.fromEntries(split(line).map((cell, i) => [`c${i}`, cell])))
    return { columns, rows }
}
