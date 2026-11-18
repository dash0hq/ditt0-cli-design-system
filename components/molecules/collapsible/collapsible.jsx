import { el, scoped } from '../../elements.js'

// A section that opens and closes under its title, as Dash0's Collapsible (Radix's): the title is a press,
// ▸ while closed and ▾ while open, and the content is drawn under it, indented, only while open.
// open: whether it is; onOpenChange(next): runs with the state a press asks for, and the page keeps it.
// meta: a dim note after the title that stays when closed, such as a count. id: its address, the title by default
export function Collapsible({ title, open = false, onOpenChange, meta, id = title, children }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column">
            <ui.Box flexDirection="row" columnGap={2}>
                <ui.Button key={scoped(id)} plain onPress={() => onOpenChange?.(!open)}>
                    {[<ui.Text dimColor>{open ? '▾' : '▸'}</ui.Text>, ' ', <ui.Text bold>{title}</ui.Text>]}
                </ui.Button>
                {meta !== undefined ? <ui.Text dimColor>{String(meta)}</ui.Text> : null}
            </ui.Box>
            {open ? <ui.Box flexDirection="column" paddingLeft={2}>{children}</ui.Box> : null}
        </ui.Box>
    )
}
