import { el } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'

// The status colours a text can take, from Dash0's semantic colour tokens (tokens.js)
const STATUS_COLORS = ['error', 'warning', 'info', 'healthy', 'debug', 'unknown', 'cta']

// A run of text. color names a Dash0 text level or a status:
// 'default' and 'intense' draw in the theme's own text colour (intense bold), 'subtle' draws dim,
// a status ('error', 'warning', 'info', 'healthy', 'debug', 'unknown', 'cta') in its inline colour.
// wrap: 'wrap' breaks prose onto more lines in a narrow pane; left out, the surface decides
export function Text({ color = 'default', weight = 'regular', mono = false, wrap, children }) {
    const ui = el()
    return (
        <ui.Text
            color={STATUS_COLORS.includes(color) ? status(color).inline : undefined}
            dimColor={color === 'subtle' || undefined}
            weight={color === 'intense' ? 'bold' : weight === 'regular' ? undefined : weight}
            mono={mono || undefined}
            wrap={wrap === 'wrap' ? 'wrap' : undefined}
        >
            {children}
        </ui.Text>
    )
}
