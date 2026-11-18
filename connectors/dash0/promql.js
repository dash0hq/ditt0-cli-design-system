// Reads what the Dash0 MCP's promql tool answers with: markdown written for the model, a table naming
// each series by its labels, then a table of values per timestamp (a blank cell where a series has no sample),
// then a link to the query in Dash0. Null when the answer isn't that shape, so the caller can draw it as text

// The cells of a markdown table's body rows, after its header and divider
const cellsOf = (lines) => lines.slice(2).map(l => l.split('|').slice(1, -1).map(c => c.trim()))

// The lines of the table under a heading, up to the first line that isn't a table row
const tableUnder = (text, heading) => {
    const lines = text.split('\n')
    const start = lines.indexOf(`# ${heading}`)
    if (start === -1) return null
    const end = lines.findIndex((l, i) => i > start && !l.startsWith('|'))
    return lines.slice(start + 1, end === -1 ? undefined : end)
}

// Whether a tool is a Dash0 promql tool. Both connectors match: mcp__claude_ai_Dash0__promql and a
// local server's, like mcp__dash0-prod__promql
export const isPromqlTool = (tool) => /^mcp__.*dash0.*__promql$/i.test(tool)

// output: the tool's content blocks, as a ToolResult carries them, or the text itself
export const parsePromql = (output) => {
    const text = Array.isArray(output)
        ? output.filter(b => b?.type === 'text').map(b => b.text).join('\n')
        : typeof output === 'string' ? output : ''
    const labels = tableUnder(text, 'Series Attribute Sets')
    const values = tableUnder(text, 'Query Results per Series ID')
    if (!labels || !values || values.length < 3) return null

    // A series with no labels is named by its id (#1); otherwise by its label values. Its labels, by key,
    // go along as attributes: the color manager reads meaning from them (an ERROR status draws red)
    const keys = labels[0].split('|').slice(2, -1).map(c => c.trim())
    const names = Object.fromEntries(cellsOf(labels).map(([id, ...rest]) => [id, rest.filter(Boolean).join(', ') || id]))
    const attributes = Object.fromEntries(cellsOf(labels).map(([id, ...rest]) =>
        [id, Object.fromEntries(keys.map((k, i) => [k, rest[i]]).filter(([, v]) => v))]))
    const ids = values[0].split('|').slice(1, -1).map(c => c.trim()).slice(1)
    const rows = cellsOf(values)
    const series = ids.map((id, i) => ({
        name: names[id] ?? id,
        attributes: attributes[id] ?? {},
        values: rows.map(r => r[i + 1] === '' || r[i + 1] === undefined ? null : Number(r[i + 1])),
    }))
    if (series.some(s => s.values.some(v => Number.isNaN(v)))) return null

    // HH:MM in the person's own time zone, as Dash0 labels a chart's axis; a timestamp that isn't ISO stays as written
    const times = rows.map(r => Number.isNaN(Date.parse(r[0])) ? r[0] : clockTime(Date.parse(r[0])))
    const link = text.match(/\[Open [^\]]*\]\((https:\/\/[^)\s]+)\)/)?.[1] ?? null
    return { series, times, link }
}

const pad = (n) => String(n).padStart(2, '0')

// A moment as the person's clock reads it, 24-hour (TIME-001): 09:35, or 09:35:05 with seconds
export const clockTime = (ms, { seconds = false } = {}) => {
    const d = new Date(ms)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}${seconds ? `:${pad(d.getSeconds())}` : ''}`
}

// The person's time zone as an offset, for a time shown once beside a chart (TIME-003): UTC, GMT+2, GMT-5:30
export const zoneOf = (ms) => {
    const offset = -new Date(ms).getTimezoneOffset()
    if (offset === 0) return 'UTC'
    const hours = Math.floor(Math.abs(offset) / 60)
    const minutes = Math.abs(offset) % 60
    return `GMT${offset > 0 ? '+' : '-'}${hours}${minutes ? `:${pad(minutes)}` : ''}`
}

// The unit a query's values are in, read from the query, for units.js to scale (1.2 s, 850 ms, 3.2 GB).
// The tool's answer names none, so this goes by what Dash0's metrics are measured in:
// - a duration (dash0.spans.duration, *_seconds, latency) is in seconds; times 1000 (or 1e3), in milliseconds
// - *_bytes or a name with bytes in it is in bytes
// - a rate() or irate() of anything else is per second: /s
// - anything else (a count, increase()) has no unit
// A query that rescales its values another way gets no unit rather than a wrong one
export const unitOf = (query = '') => {
    const q = String(query)
    const milli = /\*\s*(1000|1e3)\b/.test(q)
    if (/duration|latency|_seconds\b|\bseconds\b/i.test(q)) {
        if (milli) return 'milliseconds'
        return /[*/]\s*[0-9.]+/.test(q.replace(/\[[^\]]*\]/g, '')) ? '' : 'seconds'
    }
    if (/bytes/i.test(q)) return milli ? '' : 'bytes'
    if (/\b(i?rate)\s*\(/.test(q)) return '/s'
    return ''
}

// The server and tool a promql tool name calls, for $.mcp.call: mcp__dash0-prod__promql is dash0-prod's promql
export const serverOf = (tool) => tool.replace(/^mcp__/, '').replace(/__[^_]+$/, '')
export const toolOf = (tool) => tool.split('__').pop()

// The arguments a promql call took, without the call's own fields: what a refresh runs again
export const promqlArgs = (input) => {
    if (!input || typeof input !== 'object') return null
    const args = Object.fromEntries(['query', 'dataset', 'timeRange', 'timeSeriesOptions', 'timestamp'].filter(k => input[k] !== undefined).map(k => [k, input[k]]))
    return typeof args.query === 'string' ? args : null
}

// The same query over the same span, ending now: an absolute time range moves forward by the time since it
// ended, a relative one (now-1h to now) and a query without one already end now, a reference timestamp becomes now
export const rollForward = (args, now) => {
    const { timeRange, timestamp, ...rest } = args
    const from = Date.parse(timeRange?.from)
    const to = Date.parse(timeRange?.to)
    if (timeRange && !Number.isNaN(from) && !Number.isNaN(to)) {
        return { ...rest, timeRange: { from: new Date(now - (to - from)).toISOString(), to: new Date(now).toISOString() } }
    }
    return { ...rest, ...(timeRange ? { timeRange } : {}), ...(timestamp ? { timestamp: new Date(now).toISOString() } : {}) }
}
