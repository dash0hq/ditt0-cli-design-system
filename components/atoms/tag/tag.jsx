import { el, scoped } from '../../elements.js'
import { button } from '../../foundations/tokens/tokens.js'

// A filter or attribute on a view, as Dash0's filter bar draws one: its key, operator and value, such as
// service.name = api, on level 2's fill so the three read as one thing. The key and operator are dim, the value
// at full strength: the value is what differs between tags.
// label: the attribute's key; value: what it matches, or none for a tag that is only a word (a label such as Beta
// belongs in a Badge); onRemove(): adds ✕, which takes the tag off. id: its address, remove-<id> the ✕'s
export function Tag({ label, value, operator = '=', onRemove, id = label }) {
    const ui = el()
    return (
        <ui.Box flexDirection="row" backgroundColor={button().stroke} paddingX={1} columnGap={1}>
            {value === undefined
                ? <ui.Text>{label}</ui.Text>
                : [<ui.Text dimColor>{label}</ui.Text>, <ui.Text dimColor>{operator}</ui.Text>, <ui.Text>{value}</ui.Text>]}
            {onRemove ? <ui.Button key={scoped(`remove-${id}`)} label="✕" plain dimColor onPress={() => onRemove()} /> : null}
        </ui.Box>
    )
}
