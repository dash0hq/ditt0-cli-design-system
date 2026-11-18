import { theme } from '../../elements.js'

// Dash0's colours, following Dash0's web design system. That is the source of truth: when a value changes
// there, change it here.
//
// A mod draws with hex colours or Claude Code's theme keys, so only colours that work as a flat fill or a
// text colour come over. Text levels don't: a terminal's own text colour follows the person's theme better
// than any hex could, so components draw default text as the theme's text, subtle text dim.

// Status colours: the semantic colour tokens, dark and light.
// bg is the fill, text the ink drawn on that fill, inline the colour for text on a plain surface
const STATUS = {
    dark: {
        error: { bg: '#e33238', text: '#ffe9e9', inline: '#e33238' },
        warning: { bg: '#ffe54f', text: '#261f15', inline: '#ffe54f' },
        info: { bg: '#7eaacf', text: '#0f1519', inline: '#7eaacf' },
        healthy: { bg: '#48b78c', text: '#092a1d', inline: '#48b78c' },
        debug: { bg: '#b9c8e0', text: '#292d32', inline: '#b9c8e0' },
        unknown: { bg: '#939396', text: '#27272a', inline: '#939396' },
        cta: { bg: '#7c3aed', text: '#f5f3ff', inline: '#8b5cf6' },
    },
    light: {
        error: { bg: '#ff3d44', text: '#ffe9e9', inline: '#e33238' },
        warning: { bg: '#facc15', text: '#422006', inline: '#ca8a04' },
        info: { bg: '#60a5fa', text: '#ffffff', inline: '#2563eb' },
        healthy: { bg: '#6bc2a0', text: '#092a1d', inline: '#389e77' },
        debug: { bg: '#9acffc', text: '#ffffff', inline: '#7eaacf' },
        unknown: { bg: '#bdbdc0', text: '#27272a', inline: '#939396' },
        cta: { bg: '#8b5cf6', text: '#f5f3ff', inline: '#8b5cf6' },
    },
}

// The Badge's own colours, which predate the semantic tokens. Each Badge colour names its fill
const BADGE = {
    dark: { success: '#58be74', critical: '#e33238', attention: '#ffe54f', severe: '#ff835c', primary: '#7c3aed' },
    light: { success: '#6be88d', critical: '#ff5e62', attention: '#ffdb38', severe: '#ff835c', primary: '#8b5cf6' },
}

// An outline button's border, the stroke of level 2 (lvl-2-stroke), which the web Button's outline variant
// draws with
const BUTTON = {
    dark: { stroke: '#414144' },
    light: { stroke: '#e4e4e7' },
}

// A raised surface, a panel a step lighter than the page: level 2 of the level tokens in dark
// (lvl-2-bg, lvl-2-stroke), and the subtle background in light (lvl-0-subtle-bg, lvl-0-stroke), where every level is
// white; hexes from colors.css
const RAISED = {
    dark: { bg: '#27272a', stroke: '#414144' },
    light: { bg: '#f3f3f6', stroke: '#e4e4e7' },
}

// A selected toggle's border. In Claude Code Button draws it with the theme key 'suggestion', so this hex is only for
// terminals outside Claude Code, which have no theme keys: Claude Code's suggestion colour in its dark and light themes
const SELECTED = { dark: '#b1b9f9', light: '#5769f7' }

// Chart series colours, the default ("auto") palette, in its order.
// Dark and light are different orderings, not one palette reshaded, so a series' colour changes with the theme
const SERIES = {
    dark: ['#828aff', '#225584', '#829ed6', '#6d459b', '#b89d6a', '#a39999', '#d0af57', '#d8b4fe', '#74d1f0'],
    light: ['#4ca8a5', '#4038c0', '#e1831a', '#c54474', '#7975f6', '#3e68ee', '#641ec9', '#b35b0a', '#dcc223'],
}
// A series with no colour of its own (unset in the palette)
const SERIES_UNSET = { dark: '#52525b', light: '#a1a1aa' }

// Log severities and span status reuse
// the status colours. Span OK is info, not healthy: Dash0 draws a fine span blue
const SEVERITY = { FATAL: 'error', ERROR: 'error', WARN: 'warning', INFO: 'info', DEBUG: 'debug', TRACE: 'debug', UNKNOWN: 'unknown' }
const SPAN_STATUS = { ERROR: 'error', OK: 'info', UNSET: 'unknown' }

// Every colour of a group for the current theme, by name: what the Colors story draws
export const palette = () => ({
    status: STATUS[theme()],
    badge: BADGE[theme()],
    series: SERIES[theme()],
})

export const status = (name) => STATUS[theme()][name]

// What a hovered mark lights to: its own colour moved 30% toward the theme's text (lighter on dark, darker on
// light), so it stands out without the glare of plain white. A colour that isn't a hex is left as it is
export const highlight = (color, amount = 0.3) => {
    if (!/^#[0-9a-f]{6}$/i.test(String(color))) return color
    const to = theme() === 'light' ? 0 : 255
    const mix = (i) => Math.round(parseInt(color.slice(i, i + 2), 16) * (1 - amount) + to * amount).toString(16).padStart(2, '0')
    return `#${mix(1)}${mix(3)}${mix(5)}`
}
export const badge = (name) => BADGE[theme()][name]
export const button = () => BUTTON[theme()]
export const raised = () => RAISED[theme()]
export const series = (i) => SERIES[theme()][i % SERIES[theme()].length]
export const seriesUnset = () => SERIES_UNSET[theme()]
export const severity = (level) => status(SEVERITY[level] ?? 'unknown')
export const spanStatus = (code) => status(SPAN_STATUS[code] ?? 'unknown')

// Every colour above, for code outside Claude Code: scripts/export-tokens.mjs writes it to tokens.json and the Go package
export const TOKENS = {
    status: STATUS,
    badge: BADGE,
    button: BUTTON,
    raised: RAISED,
    selected: SELECTED,
    series: SERIES,
    seriesUnset: SERIES_UNSET,
    severity: SEVERITY,
    spanStatus: SPAN_STATUS,
}
