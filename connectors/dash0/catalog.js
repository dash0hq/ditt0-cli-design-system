// Reads what the Dash0 MCP's getServiceCatalog and getFailedChecks tools answer with: one markdown table written for
// the model, a row per service or check, then a line about paging and a link to the same view in Dash0. Null when
// the answer isn't that shape, so the caller can keep what it had

// The text of a tool's answer: its content blocks, as $.mcp.call and a ToolResult carry them, or the text itself
export const textOf = (output) => Array.isArray(output)
    ? output.filter(b => b?.type === 'text').map(b => b.text).join('\n')
    : typeof output === 'string' ? output : ''

// The first markdown table in the text, as one object per row keyed by its header's labels; null without one.
// It ends at the first line that isn't a row, so a later table (getFailedChecks' Labels) is never read
export const firstTable = (text) => {
    const lines = text.split('\n')
    const start = lines.findIndex(l => l.startsWith('|'))
    if (start === -1) return null
    const end = lines.findIndex((l, i) => i > start && !l.startsWith('|'))
    const table = lines.slice(start, end === -1 ? undefined : end)
    if (table.length < 2) return null
    const cells = (line) => line.split('|').slice(1, -1).map(c => c.trim())
    const keys = cells(table[0])
    return table.slice(2).map(line => Object.fromEntries(cells(line).map((c, i) => [keys[i], c])))
}

// The link to the same view in Dash0, the tool's last markdown link
export const linkOf = (text) => [...text.matchAll(/\[(?:Open|View) [^\]]*\]\((https:\/\/[^)\s]+)\)/g)].pop()?.[1] ?? null

const HEALTH = ['healthy', 'degraded', 'critical']

// The services the catalog lists, as organisms/services draws them: { name, namespace, requests, errors, p95, health }.
// requests: the total over the time range asked; errors: a percentage ('0.0042 %' is 0.0042); p95: seconds; health:
// Dash0's own, or none when it gave one Services doesn't know. External dependencies (databases, third-party APIs)
// are left out: Dash0 doesn't run them, and their numbers are every caller's together
export const parseServiceCatalog = (output) => {
    const text = textOf(output)
    const rows = firstTable(text)
    if (!rows || (rows.length && !('service.name' in rows[0] && 'requests_total' in rows[0]))) return null
    const services = rows
        .filter(r => !/\bexternal\b/.test(r['dash0.resource.type'] ?? ''))
        .map(r => ({
            name: r['service.name'],
            namespace: r['service.namespace'] || null,
            requests: Number(r.requests_total),
            errors: Number.parseFloat(r.errors_percentage),
            p95: Number(r.duration_p95_seconds),
            health: HEALTH.includes(r.Health?.toLowerCase()) ? r.Health.toLowerCase() : undefined,
        }))
    if (services.some(s => !s.name || [s.requests, s.errors, s.p95].some(Number.isNaN))) return null
    return { services, link: linkOf(text) }
}

// The checks still failing, as organisms/failed-checks draws them: { status, summary, rule, since, services }.
// The tool also lists checks that ended in the time range (Last Status resolved) and ones it has no status for
// (unknown): neither is failing, so neither is kept. A check naming a service twice names it once.
// An answer without a table is none failing only when it says so (no failed checks, 0 failed checks); anything
// else is null, so a page never reads an answer it doesn't know as all passing
export const parseFailedChecks = (output) => {
    const text = textOf(output)
    const rows = firstTable(text)
    if (!rows) return /\b(no|0) failed checks\b/i.test(text) ? { checks: [], link: linkOf(text) } : null
    if (rows.length && !('Last Status' in rows[0])) return null
    const checks = rows
        .filter(r => r['Last Status'] === 'critical' || r['Last Status'] === 'degraded')
        .map(r => ({
            status: r['Last Status'],
            summary: r['dash0.failed_check.summary'],
            rule: r['Check Rule Name'],
            since: r['Start Time'],
            services: [...new Set((r['Referenced Services'] ?? '').split(',').map(s => s.trim()).filter(Boolean))],
        }))
    return { checks, link: linkOf(text) }
}
