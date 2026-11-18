import { el, surface, scoped } from '../../elements.js'
import { status, raised } from '../../foundations/tokens/tokens.js'
import { keyFor } from '../../measure.js'

// The glyphs of each variant, a frame each. spin: a braille dot running round, as Claude Code's own spinner turns;
// pulse: a square that swells and fades, in the CTA purple
const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const PULSE = ['▪', '◼', '■', '◼', '▪', '·']

// A colour moved toward the raised background by amount (0 to 1), so a pulse fades into the page
const fade = (color, amount) => {
    const to = raised().bg
    const mix = (i) => Math.round(parseInt(color.slice(i, i + 2), 16) * (1 - amount) + parseInt(to.slice(i, i + 2), 16) * amount).toString(16).padStart(2, '0')
    return `#${mix(1)}${mix(3)}${mix(5)}`
}

// Something on its way, such as a panel waiting for Dash0's answer: a moving glyph, then what is loading, dim.
// The glyph moves by itself (loader.client.js), on the surface's frame clock; on mobile, which draws no Client, it
// stands still. variant: 'spin' (the default) or 'pulse'. label: what is loading, such as Loading requests…
// id: the loader's key, for two on one page with one label
export function Loader({ label, variant = 'spin', id }) {
    const ui = el()
    const cta = status('cta').inline
    const frames = variant === 'pulse' ? PULSE : SPIN
    // A pulse fades toward the page and back as it shrinks; a spin keeps its colour
    const colors = variant === 'pulse' ? [0.5, 0.25, 0, 0.25, 0.5, 0.75].map(a => fade(cta, a)) : [cta]
    if (surface() === 'mobile') {
        return <ui.Text><ui.Text color={cta}>{frames[0]}</ui.Text>{label ? <ui.Text dimColor>{` ${label}`}</ui.Text> : null}</ui.Text>
    }
    return <ui.Client key={id ? scoped(id) : keyFor(`loader-${variant}`, label ?? '')} module="./loader.client.js" props={{ frames, colors, ms: variant === 'pulse' ? 160 : 80, label: label ?? '' }} />
}
