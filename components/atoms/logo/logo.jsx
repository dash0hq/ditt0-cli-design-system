import { el, surface, scoped } from '../../elements.js'
import { QUADRANTS } from './ditt0-body.js'
import { COLUMNS, ROWS, glyphs, frame, restPose } from './ditt0-body.js'
import { pixels, halfBlocks, WORDMARK } from '../heading/font.js'

// Dash0's mark (src/icons/colored/dash0-logo-colored.tsx, a 24 by 24 view box): a half disc, its flat side
// left, beside a full circle, filled from coral at the top to red at the foot, as its radial gradient runs
const inMark = (x, y) => ((x >= 3 && ((x - 3) / 7) ** 2 + ((y - 12) / 6) ** 2 <= 1) || (x - 16) ** 2 + (y - 12) ** 2 <= 36)
const CORAL = [0xff, 0x8a, 0x67]
const RED = [0xfa, 0x4a, 0x4d]
const hex = (rgb) => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
const gradient = (t) => hex(CORAL.map((c, i) => c + (RED[i] - c) * t))

// The mark in quadrant blocks, lines tall: a cell's four pixels each the majority of a 3 by 3 sample, the cell
// coloured by how far down it sits. A pixel is twice as tall as it is wide, as a terminal cell is
const mark = (lines) => {
    const step = 12 / (lines * 2)
    const columns = Math.ceil(19 / (step / 2) / 2)
    const filled = (px, py) => {
        let n = 0
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) n += inMark(3 + (px + (i + 0.5) / 3) * step / 2, 6 + (py + (j + 0.5) / 3) * step)
        return n > 4
    }
    return Array.from({ length: lines }, (_, row) => ({
        color: gradient(lines > 1 ? row / (lines - 1) : 0),
        text: Array.from({ length: columns }, (_, c) => QUADRANTS[[filled(c * 2, row * 2), filled(c * 2 + 1, row * 2), filled(c * 2, row * 2 + 1), filled(c * 2 + 1, row * 2 + 1)].reduce((m, on, i) => on ? m | (1 << i) : m, 0)]).join(''),
    }))
}

// dash0 in four pixel rows, for the small logo: two lines in half blocks, the 0 as tall as the d
const WORDMARK_SMALL = {
    d: ['..#', '.##', '#.#', '.##'], a: ['...', '##.', '#.#', '.##'], s: ['...', '.##', '.#.', '##.'],
    h: ['#..', '##.', '#.#', '#.#'], 0: ['.#.', '#.#', '#.#', '.#.'],
}

// Dash0's logo in pixels: the mark, three lines tall, and the dash0 wordmark beside it in the theme's text colour.
// wordmark: false draws the mark alone. size: 'default', three lines; 'small', two
export function Dash0Logo({ wordmark = true, size = 'default' }) {
    const ui = el()
    const lines = size === 'small' ? 2 : 3
    const words = wordmark ? halfBlocks(pixels('dash0', size === 'small' ? WORDMARK_SMALL : WORDMARK)) : []
    return (
        <ui.Box flexDirection="column">
            {mark(lines).map((line, i) => (
                <ui.Text>
                    <ui.Text color={line.color}>{line.text}</ui.Text>
                    {wordmark ? ` ${words[i]}` : ''}
                </ui.Text>
            ))}
        </ui.Box>
    )
}

// Ditt0, the product design agent, at rest, six lines tall. In the terminal a Raster, which a hooks module
// repaints with $.ui.blit({ key: id, cells: frame(...) }) to animate it (ditt0-body.js); elsewhere its glyphs
export const DITT0_SIZE = { columns: COLUMNS, rows: ROWS }
export function Ditt0Logo({ id = 'ditt0-logo' }) {
    const ui = el()
    const rest = { pose: restPose(), mood: 'idle', seconds: 0, doneFor: -1 }
    if (surface() === 'terminal') return <ui.Raster key={scoped(id)} columns={COLUMNS} rows={ROWS} cells={frame(rest)} />
    return <ui.Box flexDirection="column">{glyphs(rest).map(line => <ui.Text color="#e15ff4">{line}</ui.Text>)}</ui.Box>
}
