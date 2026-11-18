import { TOKENS } from '../../components/foundations/tokens/tokens.js'

// Paints the element trees the goldens' components draw (Timeseries, Stat, Button, ChartControls, Legend) as rows of
// styled runs, the way Claude Code's terminal lays them out: Ink's flexbox, for the parts these trees use. Rows and
// columns at their content's size, gap, columnGap and rowGap, padding, marginTop in a column, a round border, a row that wraps at the
// width it has, justifyContent and alignItems, a column's children stretched across it, and Text nested in Text.
// Hover cards (display none, or placed absolute) and measure regions (Client) draw nothing, as with no pointer.
// A plain Button is its label; dimColor draws it dim.
// Not a host: anything else it meets is an error, so a golden never draws what Claude Code wouldn't

// A theme key as the goldens write it: suggestion as its hex (tokens.js SELECTED), subtle as dim
const colorOf = (color, theme) => {
    if (color === undefined || color === null) return {}
    if (/^#[0-9a-f]{6}$/i.test(color)) return { fg: color }
    if (color === 'suggestion') return { fg: TOKENS.selected[theme] }
    if (color === 'subtle') return { dim: true }
    throw new Error(`goldens: no colour for the theme key ${color}`)
}

const textStyle = (p, inherited, theme) => {
    const s = { ...inherited, ...(p.color !== undefined ? colorOf(p.color, theme) : {}) }
    if (p.backgroundColor !== undefined) s.bg = colorOf(p.backgroundColor, theme).fg
    if (p.bold) s.bold = true
    if (p.dimColor) s.dim = true
    return s
}

// A Text's characters with their styles, a line each
const textLines = (el, inherited, theme) => {
    const lines = [[]]
    const walk = (children, style) => {
        for (const c of children) {
            if (typeof c === 'string') {
                for (const ch of c) {
                    if (ch === '\n') lines.push([])
                    else lines[lines.length - 1].push({ ch, style })
                }
            } else if (c?.type === 'Text') walk(c.children ?? [], textStyle(c.props ?? {}, style, theme))
            else if (c) throw new Error(`goldens: a ${c.type} inside a Text`)
        }
    }
    walk(el.children ?? [], textStyle(el.props ?? {}, inherited, theme))
    return lines
}

const button = (el) => {
    const p = el.props ?? {}
    if (!p.plain) throw new Error('goldens: only plain Buttons')
    // How Claude Code draws a hotkey beside a label is its own: no golden draws one
    if (p.hotkey) throw new Error('goldens: no Button hotkeys')
    const label = el.children?.length ? el.children : [p.label ?? '']
    return { type: 'Text', props: { dimColor: p.dimColor }, children: label }
}

const hidden = (el) => el && typeof el === 'object' && (el.type === 'Client' || el.props?.display === 'none' || el.props?.position === 'absolute')

// A node laid out: its size, and how it paints
const measure = (el, avail, theme) => {
    if (typeof el === 'string') el = { type: 'Text', props: {}, children: [el] }
    if (el.type === 'Button') el = button(el)
    if (el.type === 'Text') {
        const lines = textLines(el, {}, theme)
        return { w: Math.max(0, ...lines.map(l => l.length)), h: lines.length, mt: 0, paint: (put, x, y) => lines.forEach((l, r) => l.forEach((c, i) => put(x + i, y + r, c.ch, c.style))) }
    }
    if (el.type !== 'Box') throw new Error(`goldens: no ${el.type}`)
    const p = el.props ?? {}
    const border = p.borderStyle ? 1 : 0
    if (p.borderStyle && p.borderStyle !== 'round') throw new Error(`goldens: no ${p.borderStyle} border`)
    const pl = (p.paddingLeft ?? p.paddingX ?? p.padding ?? 0) + border
    const pr = (p.paddingRight ?? p.paddingX ?? p.padding ?? 0) + border
    const pt = (p.paddingTop ?? p.paddingY ?? p.padding ?? 0) + border
    const pb = (p.paddingBottom ?? p.paddingY ?? p.padding ?? 0) + border
    const row = (p.flexDirection ?? 'row') === 'row'
    const gapX = p.columnGap ?? p.gap ?? 0
    const gapY = p.rowGap ?? p.gap ?? 0
    const inner = avail - pl - pr
    const kids = (el.children ?? []).filter(c => !hidden(c)).map(c => measure(c, inner, theme))
    const placed = []
    let w = 0
    let h = 0
    if (row) {
        // Lines of children, a new one where the next would pass the width, when the row wraps
        const lines = [[]]
        let used = 0
        for (const k of kids) {
            const line = lines[lines.length - 1]
            if (p.flexWrap === 'wrap' && line.length && used + gapX + k.w > inner) { lines.push([k]); used = k.w }
            else { line.push(k); used += (line.length > 1 ? gapX : 0) + k.w }
        }
        let y = 0
        lines.forEach((line, li) => {
            const lineH = Math.max(0, ...line.map(k => k.h))
            const lineW = line.reduce((a, k) => a + k.w, 0) + gapX * Math.max(0, line.length - 1)
            const between = p.justifyContent === 'space-between' && line.length > 1 && Number.isFinite(inner) ? (inner - lineW) / (line.length - 1) : 0
            let x = p.justifyContent === 'flex-end' && Number.isFinite(inner) ? inner - lineW : 0
            for (const k of line) {
                const dy = p.alignItems === 'center' ? Math.floor((lineH - k.h) / 2) : p.alignItems === 'flex-end' ? lineH - k.h : 0
                // Stretched: a column child as tall as its line (alignItems stretch, Ink's default)
                const stretched = (p.alignItems ?? 'stretch') === 'stretch' ? lineH : k.h
                placed.push({ k, x: Math.round(x), y: y + dy, h: stretched })
                x += k.w + gapX + between
            }
            w = Math.max(w, between ? inner : lineW)
            y += lineH + (li < lines.length - 1 ? gapY : 0)
        })
        h = y
    } else {
        w = Math.max(0, ...kids.map(k => k.w))
        let y = 0
        kids.forEach((k, i) => { y += k.mt; placed.push({ k, x: 0, y, w }); y += k.h + (i < kids.length - 1 ? gapY : 0) })
        h = y
    }
    if (row && kids.some(k => k.mt)) throw new Error('goldens: marginTop in a row')
    const width = w + pl + pr
    return {
        w: width,
        mt: p.marginTop ?? 0,
        h: h + pt + pb,
        // stretchH: the height a row's alignItems stretch gives it, for a column whose children sit at its foot
        paint: (put, x, y, stretchH) => {
            const height = Math.max(h + pt + pb, stretchH ?? 0)
            if (p.backgroundColor) {
                const bg = colorOf(p.backgroundColor, theme).fg
                for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) put(x + c, y + r, ' ', { bg })
            }
            if (border) {
                const edge = { ...colorOf(p.borderColor, theme), ...(p.borderDimColor ? { dim: true } : {}) }
                for (let c = 1; c < width - 1; c++) { put(x + c, y, '─', edge); put(x + c, y + height - 1, '─', edge) }
                for (let r = 1; r < height - 1; r++) { put(x, y + r, '│', edge); put(x + width - 1, y + r, '│', edge) }
                put(x, y, '╭', edge); put(x + width - 1, y, '╮', edge); put(x, y + height - 1, '╰', edge); put(x + width - 1, y + height - 1, '╯', edge)
            }
            // A column's children at its foot (justifyContent flex-end), when it is stretched taller than they are
            const drop = !row && p.justifyContent === 'flex-end' ? Math.max(0, height - (h + pt + pb)) : 0
            for (const c of placed) c.k.paint(put, x + pl + c.x, y + pt + c.y + drop, c.h)
        },
    }
}

// The tree as rows of runs, { text, fg, bg, bold, dim }, at most width cells wide; blank cells at a row's end cut
export const paint = (tree, width, theme = 'dark') => {
    const laid = measure(tree, width, theme)
    const grid = Array.from({ length: laid.h }, () => Array.from({ length: Math.max(laid.w, 0) }, () => ({ ch: ' ', style: {} })))
    const put = (x, y, ch, style) => {
        if (!grid[y] || x < 0 || x >= grid[y].length) return
        const under = grid[y][x].style
        grid[y][x] = { ch, style: { ...(under.bg ? { bg: under.bg } : {}), ...style } }
    }
    laid.paint(put, 0, 0)
    return grid.map(row => {
        let end = row.length
        while (end > 0 && row[end - 1].ch === ' ' && !row[end - 1].style.bg) end--
        const runs = []
        for (const { ch, style } of row.slice(0, end)) {
            const s = { ...(style.fg ? { fg: style.fg } : {}), ...(style.bg ? { bg: style.bg } : {}), ...(style.bold ? { bold: true } : {}), ...(style.dim ? { dim: true } : {}) }
            const last = runs[runs.length - 1]
            if (last && last.fg === s.fg && last.bg === s.bg && last.bold === s.bold && last.dim === s.dim) last.text += ch
            else runs.push({ text: ch, ...s })
        }
        return runs
    })
}

export const plainText = (rows) => rows.map(r => r.map(c => c.text).join('')).join('\n')
