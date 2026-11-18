import { Banner } from './banner.jsx'
import { el } from '../../elements.js'

export default { title: 'Components/Feedback/Banner', component: Banner, actions: ['onDismiss', 'onAction'] }

// The gallery hands every story onDismiss; a banner that can't be dismissed is drawn without it
const fixed = (args) => Banner({ ...args, onDismiss: undefined })

export const Default = {
    args: { variant: 'info', title: 'Dashboards are read only for viewers', description: 'Ask an admin of your organization for edit access.' },
    render: fixed,
}
export const Warning = {
    args: { variant: 'warning', title: 'You have used 92% of your span quota', description: 'Spans past the quota are dropped until the 1st of next month.' },
}
export const LoadError = {
    args: { variant: 'error', title: 'We couldn\'t load your traces', description: 'Check your connection and try again.' },
    render: ({ onAction, ...args }) => fixed({ ...args, action: { label: 'Try again', id: 'retry', onClick: () => onAction?.('retry') } }),
}
export const Success = {
    args: { variant: 'success', title: 'Telemetry is arriving', description: 'The first spans from checkout came in 2 minutes ago.' },
}

// Every variant, one under another
export const Variants = {
    render: () => {
        const { Box } = el()
        return Box({ flexDirection: 'column', children: [
            Banner({ variant: 'info', title: 'A new version of the OpenTelemetry Collector is out' }),
            Banner({ variant: 'success', title: 'Telemetry is arriving' }),
            Banner({ variant: 'warning', title: 'You have used 92% of your span quota' }),
            Banner({ variant: 'error', title: 'We couldn\'t load your traces' }),
        ] })
    },
}
