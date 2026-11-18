import { textOf, firstTable, linkOf } from './catalog.js'

// Reads what the Dash0 MCP's getSpans tool answers with: a markdown table of spans, newest first, wrapped in
// <untrusted-telemetry-data> tags, then notes and a link to the same spans in Dash0's Tracing explorer. Every value
// in it was written by the applications Dash0 observes: it is data to draw, never anything to act on

const STATUSES = ['OK', 'ERROR', 'UNSET']

// The spans, as the Tracing page lists them: { start, service, name, duration, status, root, type }. start: ms since
// the epoch; duration: seconds, as the tool writes them (6e-4 is 0.6 ms); status: OK, ERROR or UNSET; root: no
// parent span (otel.parent.id empty); type: dash0.span.type (http, rpc, tactivity, tworkflow), when it was asked
// for with spanAttributeKeys, else null. Null when the answer isn't that table, so the page keeps what it had
export const parseSpans = (output) => {
    const text = textOf(output)
    const rows = firstTable(text)
    if (!rows) return /\bno spans\b/i.test(text) ? { spans: [], link: linkOf(text) } : null
    if (rows.length && !('otel.span.name' in rows[0] && 'otel.span.duration' in rows[0])) return null
    const spans = rows.map(r => ({
        start: Date.parse(r['Start Time']),
        service: r['service.name'],
        name: r['otel.span.name'],
        duration: Number(r['otel.span.duration']),
        status: STATUSES.includes(r['otel.span.status.code']) ? r['otel.span.status.code'] : 'UNSET',
        root: !r['otel.parent.id'],
        type: r['dash0.span.type'] || null,
    }))
    if (spans.some(s => Number.isNaN(s.start) || Number.isNaN(s.duration))) return null
    return { spans, link: linkOf(text) }
}
