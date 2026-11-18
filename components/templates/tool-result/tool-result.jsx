import { el } from '../../elements.js'

// The slot under a tool call in the transcript: what the call found, a line about what it left out,
// then the actions on it. Every slot but body is optional
export function ToolResultTemplate({ body, notice, actions = [] }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column">
            {body}
            {notice ? [<ui.Text dimColor>{notice}</ui.Text>] : []}
            {actions.length ? [<ui.Box flexDirection="row" columnGap={2}>{actions}</ui.Box>] : []}
        </ui.Box>
    )
}
