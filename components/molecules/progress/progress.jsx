import { el } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'

// How far along something is, or how full: a bar of value out of max, width cells long, then the share as a
// percent. The filled part is drawn in half cells (━ and ╸), so it moves by half a cell; the rest is a dim track.
// label: what it measures, before the bar, such as Disk or Ingestion quota.
// color: a status ('cta', the default, 'healthy', 'warning', 'error', 'info', ...): pick the one the value means,
// such as error for a quota nearly spent. showValue: false leaves the percent off
export function Progress({ value, max = 100, label, color = 'cta', width = 20, showValue = true }) {
    const ui = el()
    const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
    const halves = Math.round(share * width * 2)
    const full = Math.floor(halves / 2)
    const filled = '━'.repeat(full) + (halves % 2 ? '╸' : '')
    return (
        <ui.Box flexDirection="row" columnGap={1}>
            {label ? <ui.Text dimColor>{label}</ui.Text> : null}
            <ui.Text>
                <ui.Text color={status(color).inline}>{filled}</ui.Text>
                <ui.Text dimColor>{'━'.repeat(width - filled.length)}</ui.Text>
            </ui.Text>
            {showValue ? <ui.Text>{`${Math.round(share * 100)}%`.padStart(4)}</ui.Text> : null}
        </ui.Box>
    )
}
