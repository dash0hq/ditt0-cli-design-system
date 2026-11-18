import { Tabs } from './tabs.jsx'

// Pressing a tab opens it: its value comes back as the story's value
export default { title: 'Components/Navigation/Tabs', component: Tabs, actions: ['onChange'], argsOnAction: { onChange: 'value' } }

const TABS = [
    { value: 'latency', label: 'Latency' },
    { value: 'requests', label: 'Requests' },
    { value: 'errors', label: 'Errors' },
]

export const Default = { args: { tabs: TABS, value: 'latency' } }

// The same tabs as bordered toggles, as a chart card's ranges are
export const Buttons = { args: { tabs: TABS, value: 'latency', variant: 'buttons', gap: 0 } }
