import { el, scoped, isFocused } from '../../elements.js'
import { button, status } from '../../foundations/tokens/tokens.js'

// A setting that is on or off, as tall as a Button (three rows, the same rounded border) so the two line up in a
// row. Inside, two squares, each ██ (a cell is twice as tall as wide): the knob and its empty slot, drawn in the
// border's colour. Off, the knob is left and grey; on, it is right in Dash0's CTA purple. The label is part of the press
// The border lights while the switch holds the focus ring, as a Button's does
// id: the switch's key, the label by default. No hotkey: only a page's main CTA takes one (Button)
export function Switch({ label, checked = false, onCheckedChange, id = label, disabled = false }) {
    const ui = el()
    // Each square is its colour on its colour: the pointer and the focus invert a Button, swapping text and
    // background, and a block in one colour on the page would turn the page's colour and vanish
    const square = (color) => <ui.Text color={color} backgroundColor={color}>██</ui.Text>
    const slot = square(button().stroke)
    const knob = square(checked ? status('cta').inline : status('unknown').inline)
    return (
        <ui.Box borderStyle="round" borderColor={isFocused(scoped(id)) ? 'text' : button().stroke} borderDimColor={disabled || undefined} paddingX={1}>
            <ui.Button key={scoped(id)} plain dimColor={disabled || undefined}
                onPress={() => { if (!disabled) onCheckedChange?.(!checked) }}>
                {checked ? [slot, knob, ` ${label}`] : [knob, slot, ` ${label}`]}
            </ui.Button>
        </ui.Box>
    )
}
