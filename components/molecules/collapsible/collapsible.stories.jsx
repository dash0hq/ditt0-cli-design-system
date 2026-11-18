import { Collapsible } from './collapsible.jsx'
import { el } from '../../elements.js'

// A press sets the story's open, so the section follows, as a page keeping it would
export default {
    title: 'Components/Layout/Collapsible',
    component: Collapsible,
    actions: ['onOpenChange'],
    argsOnAction: { onOpenChange: 'open' },
}

// A span's attributes, folded under their group's name
const attributes = () => {
    const { Box, Text } = el()
    return Box({ flexDirection: 'column', children: [
        ['http.request.method', 'GET'], ['http.route', '/api/spans'], ['http.response.status_code', '503'],
    ].map(([k, v]) => Text({ children: [Text({ dimColor: true, children: [`${k} `] }), v] })) })
}

export const Default = { args: { title: 'Span attributes', meta: '3', open: false }, render: (args) => Collapsible({ ...args, children: attributes() }) }
export const Open = { args: { title: 'Span attributes', meta: '3', open: true }, render: (args) => Collapsible({ ...args, children: attributes() }) }
