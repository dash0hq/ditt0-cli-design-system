import { el } from '../../elements.js'
import { PaneTemplate } from './pane.jsx'

export default { title: 'Templates/Claude Code/Pane', component: PaneTemplate }

const Slot = ({ children }) => {
    const ui = el()
    return <ui.Text dimColor>{`[ ${children} ]`}</ui.Text>
}

export const Default = {
    render: () => <PaneTemplate nav={<Slot>nav: tabs</Slot>} body={<Slot>body: the open view</Slot>} footer="footer: a hint" />,
}
