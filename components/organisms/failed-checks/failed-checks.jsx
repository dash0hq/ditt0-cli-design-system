import { el } from '../../elements.js'
import { Badge } from '../../atoms/badge/badge.jsx'
import { Link } from '../../atoms/link/link.jsx'
import { Text } from '../../atoms/text/text.jsx'
import { Table } from '../../molecules/table/table.jsx'

// Dash0's failed check statuses, each as a Badge colour and the word it shows (CAP-003, sentence case)
const STATUS = { critical: { badge: 'critical', text: 'Critical' }, degraded: { badge: 'attention', text: 'Degraded' } }
const RANK = { critical: 0, degraded: 1 }

// How long a check has failed: its two largest units, 3h 40m, 9d 4h; under a minute, 0m
export const durationOf = (from, to) => {
    const minutes = Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / 60000))
    const [d, h, m] = [Math.floor(minutes / 1440), Math.floor(minutes / 60) % 24, minutes % 60]
    return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`
}

// The checks failing now, as Dash0's Failed checks page lists them: a count of each status in Badges over a Table
// of the checks, critical first, then the newest. A row is the status, the check's summary, the services it names,
// and how long it has failed. With nothing failing, it says so (EMPTY-006). Opens the page in Dash0 under it.
// checks: [{ status: 'critical' | 'degraded', summary, rule, since, services }], since an ISO time
// now: the time the checks were read, an ISO time, for how long each has failed; href: the page in Dash0
export function FailedChecks({ checks, now, href }) {
    const ui = el()
    const sorted = [...checks].sort((a, b) => (RANK[a.status] ?? 2) - (RANK[b.status] ?? 2) || Date.parse(b.since) - Date.parse(a.since))
    const count = (s) => checks.filter(c => c.status === s).length
    return (
        <ui.Box flexDirection="column" gap={1}>
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={2}>
                <Text color="intense">Failed checks</Text>
                {count('critical') ? <Badge label={`${count('critical')} critical`} color="critical" /> : null}
                {count('degraded') ? <Badge label={`${count('degraded')} degraded`} color="attention" /> : null}
            </ui.Box>
            {checks.length ? (
                <Table
                    columns={[
                        { key: 'status', label: 'Status' },
                        { key: 'summary', label: 'Check' },
                        { key: 'services', label: 'Service' },
                        { key: 'for', label: 'Failing for', align: 'right' },
                    ]}
                    rows={sorted.map(c => ({
                        status: { text: STATUS[c.status]?.text ?? c.status, badge: STATUS[c.status]?.badge ?? 'default' },
                        summary: c.summary,
                        services: c.services.join(', '),
                        for: durationOf(c.since, now),
                    }))}
                />
            ) : (
                <ui.Text>
                    <Text color="healthy">✓ </Text>
                    <Text>All checks passing. New failures show here.</Text>
                </ui.Text>
            )}
            {href ? <ui.Box flexDirection="row"><Link href={href} label="Open in Dash0" variant="cta" /></ui.Box> : null}
        </ui.Box>
    )
}
