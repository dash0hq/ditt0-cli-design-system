import { Select } from './select.jsx'

// A pick sets the story's value, so the select follows, as a page keeping it would
export default {
    title: 'Components/Inputs/Select',
    component: Select,
    actions: ['onValueChange'],
    argsOnAction: { onValueChange: 'value' },
}

const DATASETS = [
    { value: 'default', label: 'default' },
    { value: 'staging-shared', label: 'staging-shared' },
    { value: 'synthetic-checks', label: 'synthetic-checks' },
]
const SERVICES = ['api', 'order-history-api', 'ui', 'mail-sink', 'carts', 'currencies', 'search'].map(value => ({ value }))

export const Default = { args: { id: 'dataset', label: 'Dataset', options: DATASETS, value: 'default' } }
export const Services = { args: { id: 'service', label: 'Service', options: SERVICES, value: 'api' } }
