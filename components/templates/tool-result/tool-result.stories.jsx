import { el } from '../../elements.js'
import { ToolResultTemplate } from './tool-result.jsx'

export default { title: 'Templates/Claude Code/Tool Result', component: ToolResultTemplate }

// Templates show their slots with neutral placeholders, as Dash0's Templates do
const Slot = ({ children }) => {
    const ui = el()
    return <ui.Text dimColor>{`[ ${children} ]`}</ui.Text>
}

export const Default = {
    render: () => <ToolResultTemplate body={<Slot>body: what the call found</Slot>} />,
}
export const WithNoticeAndActions = {
    render: () => (
        <ToolResultTemplate
            body={<Slot>body: what the call found</Slot>}
            notice="notice: what the body leaves out"
            actions={[<Slot>action</Slot>, <Slot>action</Slot>]}
        />
    ),
}
