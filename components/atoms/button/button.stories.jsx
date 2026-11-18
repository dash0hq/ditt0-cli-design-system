import { Button } from './button.jsx'
import { el } from '../../elements.js'

export default {
    title: 'Components/Actions/Button',
    component: Button,
    // Props the gallery wires to its action log, as Storybook's actions panel
    actions: ['onClick'],
}

export const Default = { args: { label: 'Open in Dash0' } }
export const Cta = { args: { label: 'Create check rule', hotkey: 'n', variant: 'cta' } }
export const Destructive = { args: { label: 'Delete dashboard', variant: 'destructive' } }
export const Transparent = { args: { label: 'Show 22 more series', variant: 'transparent' } }

// The hierarchy side by side: the main action filled purple, a secondary outlined, a tertiary as its label alone
export const Hierarchy = {
    render: () => {
        const { Box } = el()
        return Box({ flexDirection: 'row', columnGap: 1, alignItems: 'center', children: [
            Button({ label: 'Create check rule', variant: 'cta' }),
            Button({ label: 'Open in Dash0' }),
            Button({ label: 'Show 22 more series', variant: 'transparent' }),
        ] })
    },
}

// A row of toggles, 24h on: outlined, the selected one's border in the accent colour, the others dim
export const Toggles = {
    render: () => {
        const { Box } = el()
        return Box({ flexDirection: 'row', children: [
            Button({ label: '1h', selected: false }),
            Button({ label: '24h', selected: true }),
            Button({ label: '6h', selected: false }),
        ] })
    },
}
