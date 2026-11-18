import { CopyButtons } from './copy-buttons.jsx'
import { markdownTable } from '../../copy.js'

export default { title: 'Components/Actions/CopyButtons', component: CopyButtons }

const columns = [{ key: 'service', label: 'Service' }, { key: 'rate', label: 'Requests', align: 'right' }]
const rows = [{ service: 'api', rate: '1120/s' }, { service: 'order-history-api', rate: '70.7/s' }]

// Both: a services table as markdown, and as the terminal draws it
export const Default = {
    args: {
        markdown: markdownTable(columns, rows),
        text: 'Service             Requests\n───────────────────────────\napi                   1120/s\norder-history-api     70.7/s',
    },
}

// Only one: a button is left out when it has nothing to copy
export const MarkdownOnly = { args: { markdown: markdownTable(columns, rows) } }
