import { el, scoped } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'
import { Button } from '../../atoms/button/button.jsx'

// What each variant draws: its status colour (tokens.js) and an icon, so the meaning never rests on colour alone
const VARIANTS = {
    info: { status: 'info', icon: 'ℹ' },
    success: { status: 'healthy', icon: '✓' },
    warning: { status: 'warning', icon: '▲' },
    error: { status: 'error', icon: '✖' },
}

// A message about a whole view that stays until it no longer holds or is dismissed, in a border of its status'
// colour: a data source that stopped sending, a quota nearly spent. A note that only confirms something done
// is a toast instead: $.ui.toast('Dashboard saved'), from the hooks module.
// variant: 'info', 'success', 'warning' or 'error'. title: what happened, short; description: why, and what to do
// (ERROR-001). action: { label, onClick, id }, an outline Button; onDismiss(): adds ✕, keyed dismiss
export function Banner({ variant = 'info', title, description, action, onDismiss }) {
    const ui = el()
    const { status: name, icon } = VARIANTS[variant] ?? VARIANTS.info
    const color = status(name).inline
    return (
        <ui.Box flexDirection="row" borderStyle="round" borderColor={color} paddingX={1} columnGap={1}>
            <ui.Text color={color}>{icon}</ui.Text>
            <ui.Box flexDirection="column" flexGrow={1} flexShrink={1}>
                <ui.Text bold>{title}</ui.Text>
                {description ? <ui.Text dimColor>{description}</ui.Text> : null}
            </ui.Box>
            {action ? <Button label={action.label} id={action.id} onClick={action.onClick} /> : null}
            {onDismiss ? <ui.Button key={scoped('dismiss')} label="✕" plain dimColor onPress={() => onDismiss()} /> : null}
        </ui.Box>
    )
}
