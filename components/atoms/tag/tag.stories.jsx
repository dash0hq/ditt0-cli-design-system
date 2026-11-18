import { Tag } from './tag.jsx'
import { el } from '../../elements.js'

export default { title: 'Components/Data/Tag', component: Tag, actions: ['onRemove'] }

// The gallery hands every story onRemove; a tag that can't be taken off is drawn without it
const fixed = (args) => Tag({ ...args, onRemove: undefined })

export const Default = { args: { label: 'service.name', value: 'api' }, render: fixed }
export const Removable = { args: { label: 'service.name', value: 'api' } }
export const Operator = { args: { label: 'http.response.status_code', operator: '>=', value: '500' }, render: fixed }
export const Word = { args: { label: 'production' }, render: fixed }

// A view's filters, one after another, wrapping when they don't fit
export const Filters = {
    render: ({ onRemove }) => {
        const { Box } = el()
        return Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 1, rowGap: 1, children: [
            Tag({ label: 'service.name', value: 'api', onRemove: () => onRemove?.('service.name') }),
            Tag({ label: 'k8s.namespace.name', value: 'acme', onRemove: () => onRemove?.('k8s.namespace.name') }),
            Tag({ label: 'otel.span.status_code', operator: '!=', value: 'UNSET', onRemove: () => onRemove?.('otel.span.status_code') }),
        ] })
    },
}
