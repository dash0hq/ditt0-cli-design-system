import { el } from '../../elements.js'

// A pane beside the transcript: its navigation on top, the open view under it, a dim line at the foot.
// actions: Buttons at the foot, before the line, such as Close; Tab and Enter reach them
export function PaneTemplate({ nav, body, footer, actions = [] }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column" gap={1}>
            {nav ? [nav] : []}
            {body}
            {actions.length
                ? [<ui.Box flexDirection="row" flexWrap="wrap" columnGap={2} alignItems="center">{[...actions, ...(footer ? [<ui.Text dimColor>{footer}</ui.Text>] : [])]}</ui.Box>]
                : footer ? [<ui.Text dimColor>{footer}</ui.Text>] : []}
        </ui.Box>
    )
}
