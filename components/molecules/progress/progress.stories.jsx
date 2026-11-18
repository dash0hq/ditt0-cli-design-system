import { Progress } from './progress.jsx'
import { el } from '../../elements.js'

export default { title: 'Components/Feedback/Progress', component: Progress }

export const Default = { args: { value: 62, label: 'Ingestion quota' } }
export const Healthy = { args: { value: 100, label: 'Backfill', color: 'healthy' } }
export const Critical = { args: { value: 94, label: 'Disk', color: 'error' } }
export const Half = { args: { value: 1, max: 40, width: 20 } }
export const NoValue = { args: { value: 30, label: 'Upload', showValue: false } }

// The disks of a cluster's nodes, the labels padded so the bars line up, each coloured by how full it is
export const Nodes = {
    render: () => {
        const { Box } = el()
        const nodes = [['node-a', 41], ['node-b', 78], ['node-c', 93]]
        return Box({ flexDirection: 'column', children: nodes.map(([name, used]) =>
            Progress({ label: name, value: used, color: used >= 90 ? 'error' : used >= 75 ? 'warning' : 'healthy' })) })
    },
}
