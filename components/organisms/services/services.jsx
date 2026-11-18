import { el } from '../../elements.js'
import { Link } from '../../atoms/link/link.jsx'
import { Text } from '../../atoms/text/text.jsx'
import { Table } from '../../molecules/table/table.jsx'
import { formatValue, formatColumn } from '../../foundations/units/units.js'

// Dash0's service health, each as a Badge colour and the word it shows
const HEALTH = { healthy: { badge: 'success', text: 'Healthy' }, degraded: { badge: 'attention', text: 'Degraded' }, critical: { badge: 'critical', text: 'Critical' } }

// A service's health from its error rate, for services Dash0 gave none: at or past errorThresholds.critical
// percent critical, past degraded degraded
export const healthOf = (errors, { degraded = 1, critical = 5 } = {}) =>
    errors >= critical ? 'critical' : errors >= degraded ? 'degraded' : 'healthy'

// The services and how they are doing, as Dash0's Services catalog lists them: a row per service, busiest first,
// with its health as a Badge, its request rate, error percentage and p95 latency (RED). Latency shares one unit down
// the column (UNIT-002). Opens the catalog in Dash0 under it.
// services: [{ name, requests, errors, p95, health }]: requests, the total over the window; errors, a percentage;
// p95, seconds; health, Dash0's own 'healthy', 'degraded' or 'critical', else worked out from errors (healthOf)
// window: the seconds the requests were counted over, for the rate; errorThresholds: { degraded, critical } percents
// title: the line over the table; href: the catalog in Dash0
export function Services({ services, window = 3600, errorThresholds, title = 'Services', href }) {
    const ui = el()
    const rows = [...services].sort((a, b) => b.requests - a.requests)
    const p95 = formatColumn(rows.map(s => s.p95), 'seconds')
    return (
        <ui.Box flexDirection="column" gap={1}>
            <Text color="intense">{title}</Text>
            <Table
                columns={[
                    { key: 'health', label: 'Health' },
                    { key: 'name', label: 'Service' },
                    { key: 'rate', label: 'Requests', align: 'right' },
                    { key: 'errors', label: 'Errors', align: 'right' },
                    { key: 'p95', label: 'P95', align: 'right' },
                ]}
                rows={rows.map((s, i) => {
                    const health = HEALTH[s.health ?? healthOf(s.errors, errorThresholds)] ?? HEALTH.healthy
                    return {
                        health: { text: health.text, badge: health.badge },
                        name: s.name,
                        rate: formatValue(s.requests / window, '/s'),
                        // Under 0.01% would round to 0%, which reads as none
                        errors: s.errors > 0 && s.errors < 0.01 ? '<0.01%' : formatValue(s.errors, 'percent'),
                        p95: p95[i],
                    }
                })}
            />
            {href ? <ui.Box flexDirection="row"><Link href={href} label="Open in Dash0" variant="cta" /></ui.Box> : null}
        </ui.Box>
    )
}
