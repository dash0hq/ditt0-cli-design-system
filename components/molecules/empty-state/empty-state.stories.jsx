import { EmptyState } from './empty-state.jsx'

export default { title: 'Components/Feedback/EmptyState', component: EmptyState, actions: ['onAction'] }

const press = (id, onAction) => () => onAction?.(id)

// A filter that matches nothing: the default kind of empty
export const Default = {
    args: { variant: 'no-results', title: 'No logs match these filters', body: 'Remove a filter or widen the time range.' },
    render: ({ onAction, ...args }) => EmptyState({ ...args, action: { label: 'Clear filters', id: 'clear-filters', onClick: press('clear-filters', onAction) } }),
}

// Nothing sent yet: EMPTY-001's pattern A, no title, two sentences, the CTA and the setup links
export const FirstTime = {
    args: {
        variant: 'first-time',
        body: 'Follow every request across your services, with the time each one spent. Find the slow spans and the errors behind a spike.',
        links: [
            { label: 'View tracing in OpenTelemetry Demo', href: 'https://app.dash0.com/goto/traces?demo=true' },
            { label: 'Get help with setup', href: 'https://www.dash0.com/documentation/dash0/get-started' },
        ],
    },
    render: ({ onAction, ...args }) => EmptyState({ ...args, action: { label: 'Send telemetry to Dash0', id: 'send-telemetry', onClick: press('send-telemetry', onAction) } }),
}

// Every failed check resolved (EMPTY-006)
export const Done = {
    args: { variant: 'done', title: 'All caught up', body: 'No checks are failing. Check back later for updates.' },
}

// The data didn't load (ERROR-004): an error with a way to recover, never the first-time state
export const LoadError = {
    args: { variant: 'error', title: 'We couldn\'t load your logs', body: 'Check your connection and try again.' },
    render: ({ onAction, ...args }) => EmptyState({ ...args, action: { label: 'Try again', id: 'retry', onClick: press('retry', onAction) } }),
}
