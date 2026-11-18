import { Input } from './input.jsx'
import { el } from '../../elements.js'

// A change sets the story's value, so the field keeps what was typed, as a page keeping it would
export default {
    title: 'Components/Inputs/Input',
    component: Input,
    actions: ['onChange', 'onSubmit'],
    argsOnAction: { onChange: 'value' },
}

export const Default = { args: { id: 'dashboard-name', label: 'Dashboard name', value: '' } }
export const Placeholder = { args: { id: 'api-key', label: 'API key', placeholder: 'd4e5f6a7-…', value: '' } }
export const Optional = { args: { id: 'description', label: 'Description', optional: true, value: '' } }
export const Invalid = { args: { id: 'dashboard-name', label: 'Dashboard name', value: 'ab', error: 'Enter a name between 3 and 64 characters.' } }
export const Multiline = { args: { id: 'query', label: 'PromQL query', rows: 3, submitLabel: 'Run query', value: 'sum by (service_name) (rate({otel_metric_name="dash0.spans"}[5m]))' } }

// A small form: most fields required, so the one that isn't says (optional) (FIELD-003)
export const Form = {
    render: () => {
        const { Box } = el()
        return Box({ flexDirection: 'column', gap: 1, children: [
            Input({ id: 'check-name', label: 'Check name', value: '' }),
            Input({ id: 'check-url', label: 'URL', placeholder: 'https://api.example.com/health', value: '' }),
            Input({ id: 'check-notes', label: 'Notes', optional: true, value: '' }),
        ] })
    },
}
