import { el, scoped } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'
import { Badge } from '../../atoms/badge/badge.jsx'

// Rows of things of one kind, one under another: services, checks, dashboards. Each row has a label, and may have
// a status dot before it (● in the status' colour), a dim description after it, a Badge, and a meta value at the
// right edge, such as a count or a time.
// items: [{ id, label, description, status, badge: Badge's props, meta }]; status names a status ('error',
// 'warning', 'healthy', 'info', 'unknown', ...).
// onSelect(id): makes each row a press, keyed item-<id>; selected: the id of the row that is open, drawn bold
// with a purple ▌ before it. Without onSelect the rows are only read
export function List({ items, selected, onSelect }) {
    const ui = el()
    const marker = status('cta').inline
    return (
        <ui.Box flexDirection="column">
            {items.map(item => {
                const isSelected = item.id === selected
                const parts = [
                    ...(item.status ? [<ui.Text color={status(item.status).inline}>●</ui.Text>, ' '] : []),
                    <ui.Text bold={isSelected || undefined}>{item.label}</ui.Text>,
                    ...(item.description ? ['  ', <ui.Text dimColor>{item.description}</ui.Text>] : []),
                ]
                return (
                    <ui.Box flexDirection="row" columnGap={1}>
                        {onSelect ? <ui.Text color={isSelected ? marker : undefined}>{isSelected ? '▌' : ' '}</ui.Text> : null}
                        <ui.Box flexGrow={1} flexShrink={1}>
                            {onSelect
                                ? <ui.Button key={scoped(`item-${item.id}`)} plain onPress={() => onSelect(item.id)}>{parts}</ui.Button>
                                : <ui.Text wrap="truncate-end">{parts}</ui.Text>}
                        </ui.Box>
                        {item.badge ? <ui.Box flexShrink={0}><Badge {...item.badge} /></ui.Box> : null}
                        {item.meta !== undefined ? <ui.Box flexShrink={0}><ui.Text dimColor>{String(item.meta)}</ui.Text></ui.Box> : null}
                    </ui.Box>
                )
            })}
        </ui.Box>
    )
}
