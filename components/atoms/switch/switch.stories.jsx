import { Switch } from './switch.jsx'
import { el } from '../../elements.js'

// A press sets the story's checked, so the switch follows, as a page keeping it would
export default {
    title: 'Components/Inputs/Switch',
    component: Switch,
    actions: ['onCheckedChange'],
    argsOnAction: { onCheckedChange: 'checked' },
}

export const Default = { args: { label: 'Auto-refresh', checked: false } }
export const Checked = { args: { label: 'Auto-refresh', checked: true } }
export const Disabled = { args: { label: 'Live tail', checked: false, disabled: true } }

// A few settings of a chart, one under another
export const Settings = {
    render: () => {
        const { Box } = el()
        return Box({ flexDirection: 'column', children: [
            Switch({ label: 'Show legend', checked: true }),
            Switch({ label: 'Stack series', checked: false }),
            Switch({ label: 'Auto-refresh', checked: true, id: 'settings-auto-refresh' }),
        ] })
    },
}
