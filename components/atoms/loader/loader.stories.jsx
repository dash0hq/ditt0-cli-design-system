import { Loader } from './loader.jsx'
import { el } from '../../elements.js'

export default { title: 'Components/Feedback/Loader', component: Loader }

export const Default = { args: { label: 'Loading from Dash0…' } }
export const Pulse = { args: { label: 'Loading requests…', variant: 'pulse' } }
export const NoLabel = { args: { variant: 'spin', id: 'loader-alone' } }

// Panels of a page, each waiting for its own answer
export const Panels = {
    render: () => {
        const { Box } = el()
        return Box({ flexDirection: 'column', children: [
            Loader({ label: 'Loading requests…', variant: 'pulse' }),
            Loader({ label: 'Loading the error rate…', variant: 'pulse' }),
            Loader({ label: 'Loading p95 latency…', variant: 'pulse' }),
        ] })
    },
}
