import { el, scoped, isFocused } from '../../elements.js'
import { status, button } from '../../foundations/tokens/tokens.js'

// Dash0's Button variants a terminal can draw, by how much the action matters:
//   cta:         primary, the one main action of a view: filled in Dash0's CTA purple, its label in the CTA ink
//   default:     secondary: an outline, level 2's border round the label, no fill (button.tsx's outline)
//   transparent: tertiary, a quiet action inside other content: the label alone, one row high
//   destructive: an action that deletes or can't be undone: an outline and label in the error colour
// cta, default and destructive are drawn in a rounded border, three rows high, so they read as controls.
// selected, for a row of toggles such as a card's ranges: true for the one that is on, its border in the accent
// colour; false for the others, border and label dim. Absent, an action.
// hotkey: only the main CTA takes one (variant 'cta'); on any other variant it is left off, so a page has one key
// to learn, not one per control. shortcut: true keeps it on any variant, for the few keys worth learning (a chart's
// zoom: i, o, r)
export function Button({ label, onClick, hotkey, shortcut = false, variant = 'default', id = label, selected }) {
    const ui = el()
    const cta = variant === 'cta' ? status('cta') : null
    const error = variant === 'destructive' ? status('error').inline : null
    const ink = cta ? cta.text : error
    const pressable = (
        <ui.Button
            key={scoped(id)}
            label={ink ? undefined : label}
            hotkey={cta || shortcut ? hotkey : undefined}
            plain
            dimColor={selected === false}
            onPress={() => onClick?.()}
        >
            {ink ? [<ui.Text color={ink} bold={Boolean(cta)}>{label}</ui.Text>] : undefined}
        </ui.Button>
    )
    if (variant === 'transparent') return pressable
    return (
        <ui.Box
            borderStyle="round"
            borderColor={selected ? 'suggestion' : cta ? cta.bg : error ?? button().stroke}
            borderDimColor={selected === false}
            backgroundColor={cta ? cta.bg : undefined}
            paddingX={1}
        >
            {pressable}
        </ui.Box>
    )
}
