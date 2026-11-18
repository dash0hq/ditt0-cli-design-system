import { parsePromql, promqlArgs, rollForward, serverOf, toolOf } from './promql.js'

// Dash0 query results that keep themselves current, as a Dash0 chart does: every REFRESH_MS the query runs
// again through the same MCP server ($.mcp.call), over the same span ending now, and the chart draws the answer.
// A transcript keeps every result it ever drew, and the engine says nothing when one scrolls out of sight, so
// only the MAX_LIVE most recent refresh; an older one stops and says it is a snapshot.
// An entry, by tool_use_id: { id, tool, source, args, result, seenAt, updatedAt, auto, failed, timer }

// Dash0's own auto-refresh period
export const REFRESH_MS = 30_000
export const MAX_LIVE = 3
// Entries kept at all, newest last, so a long session doesn't hold every result it drew
const MAX_KEPT = 50

const entries = new Map()
// The arguments of each promql call, from its tool.call, for a result whose row doesn't carry them (ToolResult)
const calls = new Map()

// tool.call: keep what the call asked, by its id
export function remember(id, input) {
    const args = promqlArgs(input)
    if (!id || !args) return
    calls.set(id, args)
    if (calls.size > MAX_KEPT) calls.delete(calls.keys().next().value)
}

// The entry for a finished promql call, made from its answer the first time it draws; null when the answer
// isn't a promql table. Without an id the result can't be told apart from another, so it draws as it came
// call: { tool_use_id, tool, input, output }; now: the time it first drew, the snapshot's time
export function track($, { tool_use_id: id, tool, input, output }, now) {
    // The answer it was made from: an id drawn again with another answer (a test reusing ids) starts over
    const source = typeof output === 'string' ? output : JSON.stringify(output)
    const known = id ? entries.get(id) : null
    if (known?.source === source) return known
    if (known) { stop(known); entries.delete(id) }
    const result = parsePromql(output)
    if (!result) return null
    const entry = { id, tool, source, args: promqlArgs(input) ?? calls.get(id) ?? null, result, seenAt: now, updatedAt: null, auto: false, failed: false, timer: null }
    if (!id) return entry
    entries.set(id, entry)
    if (entries.size > MAX_KEPT) {
        const oldest = entries.keys().next().value
        stop(entries.get(oldest))
        entries.delete(oldest)
    }
    // A new result refreshes by itself when its query is known
    if (entry.args) setAuto($, entry, true)
    return entry
}

function stop(entry) {
    entry.timer?.cancel()
    entry.timer = null
    entry.auto = false
}

// Runs the query again and keeps the answer; one that fails or doesn't parse keeps the last data and says so
export async function refresh($, entry) {
    const now = await $.clock.now()
    try {
        const answer = await $.mcp.call(serverOf(entry.tool), toolOf(entry.tool), rollForward(entry.args, now))
        const result = answer && !answer.isError ? parsePromql(answer.content) : null
        if (result) {
            entry.result = { ...result, link: result.link ?? entry.result.link }
            entry.updatedAt = now
            entry.failed = false
        } else entry.failed = true
    } catch {
        entry.failed = true
    }
    $.ui.invalidate('ui.render')
}

// Turns a result's refresh on or off. On, it joins the live ones, and the oldest past MAX_LIVE stops
export function setAuto($, entry, on) {
    if (!on) return stop(entry)
    if (entry.auto || !entry.args) return
    entry.auto = true
    entry.timer = $.clock.every(REFRESH_MS, () => { void refresh($, entry) })
    const live = [...entries.values()].filter(e => e.auto)
    for (const old of live.slice(0, Math.max(0, live.length - MAX_LIVE))) stop(old)
}
