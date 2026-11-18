import { List } from './list.jsx'

// A press sets the story's selected, so the pressed row opens, as a page keeping it would
export default {
    title: 'Components/Data/List',
    component: List,
    actions: ['onSelect'],
    argsOnAction: { onSelect: 'selected' },
}

const SERVICES = [
    { id: 'api', label: 'api', description: 'acme', status: 'error', meta: '1.2K req/s' },
    { id: 'order-history-api', label: 'order-history-api', description: 'acme', status: 'healthy', meta: '310 req/s' },
    { id: 'ui', label: 'ui', description: 'acme', status: 'warning', meta: '88 req/s' },
    { id: 'mail-sink', label: 'mail-sink', description: 'staging-shared', status: 'healthy', meta: '2 req/s' },
    { id: 'carts', label: 'carts', description: 'acme', status: 'unknown', meta: 'no data' },
]

export const Default = { args: { items: SERVICES, selected: 'api' } }

// The gallery hands every story onSelect; a list only read is drawn without it
export const ReadOnly = {
    args: {
        items: [
            { id: 'p95', label: 'P95 latency', meta: '412 ms' },
            { id: 'errors', label: 'Error rate', meta: '0.42%' },
            { id: 'rps', label: 'Requests', meta: '1.2K/s' },
        ],
    },
    render: (args) => List({ ...args, onSelect: undefined }),
}

// Failed checks, each with a Badge for its severity
export const Badges = {
    args: {
        items: [
            { id: 'c1', label: 'High error rate on api', description: '5m ago', badge: { label: 'Critical', color: 'critical' } },
            { id: 'c2', label: 'Slow responses on ui', description: '18m ago', badge: { label: 'Degraded', color: 'attention' } },
            { id: 'c3', label: 'Queue backlog in currencies', description: '1h ago', badge: { label: 'Degraded', color: 'attention' } },
        ],
    },
}
