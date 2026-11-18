import { el } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'

// Every glyph the components draw as an icon, by name: one cell each. Names follow Lucide's, as Dash0's icons do,
// where Lucide has one (check, x as close, external-link, chevron-right); the rest name what the glyph means here.
// Some glyphs mean two things: ▲ is a warning in a Banner and a rise in a Stat
export const ICONS = {
    check: '✓',
    error: '✖',
    warning: '▲',
    info: 'ℹ',
    close: '✕',
    'external-link': '↗',
    plus: '+',
    minus: '−',
    'chevron-right': '▸',
    'chevron-down': '▾',
    breadcrumb: '›',
    'trend-up': '▲',
    'trend-down': '▼',
    'status-dot': '●',
    square: '■',
    marker: '◆',
    diamond: '◇',
    empty: '∅',
    selected: '▌',
    menu: '≡',
    line: '━',
    'dashed-line': '┄',
}

// The status colours an icon can take, from Dash0's semantic colour tokens (tokens.js), as Text's
const STATUS_COLORS = ['error', 'warning', 'info', 'healthy', 'debug', 'unknown', 'cta']

// One glyph from ICONS. name: its key; an unknown name draws nothing. color: a status ('error', 'healthy', ...)
// in its inline colour, 'subtle' dim, or any colour a Text takes (a hex, a theme key); none, the theme's text
export function Icon({ name = 'check', color }) {
    const ui = el()
    const glyph = ICONS[name]
    if (!glyph) return null
    return (
        <ui.Text
            color={STATUS_COLORS.includes(color) ? status(color).inline : color === 'subtle' ? undefined : color}
            dimColor={color === 'subtle' || undefined}
        >
            {glyph}
        </ui.Text>
    )
}
