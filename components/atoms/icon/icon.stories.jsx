import { Icon, ICONS } from './icon.jsx'
import { el } from '../../elements.js'

export default { title: 'Foundations/Icons', component: Icon }

export const Default = { args: { name: 'check', color: 'healthy' } }
export const Status = { args: { name: 'error', color: 'error' } }
export const Subtle = { args: { name: 'chevron-right', color: 'subtle' } }

// Every icon beside its name, in a grid that wraps to the width it has
export const All = {
    render: () => {
        const { Box, Text } = el()
        return Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 2, children: Object.keys(ICONS).map(name =>
            Box({ flexDirection: 'row', columnGap: 1, width: 18, children: [Icon({ name }), Text({ dimColor: true, children: [name] })] })) })
    },
}
