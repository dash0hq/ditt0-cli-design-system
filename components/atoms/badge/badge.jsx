import { el } from '../../elements.js'
import { badge, status } from '../../foundations/tokens/tokens.js'

// Dash0's Badge colours, each with the ink drawn on its fill: the matching
// status' text in the semantic colour tokens (success: healthy, critical: error, attention: warning, primary: cta).
// severe has no status of its own, so it borrows warning's dark ink. default is the unknown status' fill
const INK = { success: '#092a1d', critical: '#ffe9e9', attention: '#261f15', severe: '#261f15', primary: '#f5f3ff' }

// A short label that marks a state or a count: Critical, 3 failing, Beta.
// subtle draws the label in the colour, without the fill, for a badge among many
export function Badge({ label, color = 'default', subtle = false }) {
    const ui = el()
    const fill = color === 'default' ? status('unknown').bg : badge(color)
    const ink = color === 'default' ? status('unknown').text : INK[color]
    return subtle
        ? <ui.Text color={color === 'default' ? undefined : fill} dimColor={color === 'default' || undefined}>{label}</ui.Text>
        : <ui.Text color={ink} backgroundColor={fill}>{` ${label} `}</ui.Text>
}
