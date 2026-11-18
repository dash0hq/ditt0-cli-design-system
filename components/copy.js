import { surface } from './elements.js'

// Puts text on the person's clipboard. Only a hook holds the engine, so each render hook hands over a copier here
// (copierOf), as it does its redraw, and a component's Copy button calls copy() when pressed. The copier says how
// it went in a toast: Copied, or why nothing was
let copier = () => {}
export const setCopy = (fn) => { copier = fn }
export const copy = (text) => copier(text, surface())

// The engine's clipboard ($.ui.copy: the terminal's clipboard tool or an OSC 52 write), then a toast
const WHY = { 'no-surface': 'nothing draws here', 'no-clipboard': 'this terminal has no clipboard Claude Code can reach', refused: 'another mod refused it' }
export function copierOf($) {
    return async (text, on) => {
        const copied = await $.ui.copy({ text, surface: on })
        $.ui.toast(copied.isCopied ? 'Copied' : `Couldn't copy: ${WHY[copied.reason] ?? copied.reason}`)
    }
}

// A GitHub-flavoured markdown table: a header, the alignment row (---: for a right-aligned column), a line per row.
// columns: [{ key, label, align }]; rows: [{ [key]: value }], a value text or { text } as Table takes it.
// A | in a value is escaped, a line break written as a space
const cellText = (v) => String(v !== null && typeof v === 'object' ? v.text ?? '' : v ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')
export const markdownTable = (columns, rows) => [
    `| ${columns.map(c => cellText(c.label)).join(' | ')} |`,
    `| ${columns.map(c => c.align === 'right' ? '---:' : c.align === 'center' ? ':---:' : '---').join(' | ')} |`,
    ...rows.map(r => `| ${columns.map(c => cellText(r[c.key])).join(' | ')} |`),
].join('\n')

// Text as a terminal would paste it: escape sequences out, trailing spaces cut
export const plainText = (text) => String(text).replace(/\x1b\[[\d;?]*[A-Za-z]|\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '').replace(/[ \t]+$/gm, '')
