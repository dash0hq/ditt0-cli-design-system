# promql connector

Reads the Dash0 MCP's `promql` answer into the props a page draws: `{ series, times, link }`.

Level: connector, the logic layer. No UI, so no story: it is tested on its own and through [Query Result](../../components/pages/dash0-query-result/dash0-query-result.md).

## What it reads

The answer is markdown written for Claude:

```
# Series Attribute Sets
| Series ID | service_name      |
| #1        | order-history-api |

# Query Results per Series ID
| Timestamp                | #1      |
| 2026-10-19T07:50:10.000Z | 15.5671 |

[Open metric query builder in Dash0](https://app.dash0.com/...)
```

- A series with labels is named by their values; one without is named by its id, `#1`.
- A blank cell is `null`, a gap in the chart, never `0`.
- Times are `HH:MM` on the person's own clock, as Dash0 shows them. The page names the zone once (`GMT+2`).
- An answer in any other shape returns `null`, and Claude Code draws its own row.

## Functions

| Function | Returns |
| --- | --- |
| `isPromqlTool(tool)` | Whether a tool name is a Dash0 promql tool, on the claude.ai connector or a local server |
| `parsePromql(output)` | `{ series, times, link }`, or `null` |
| `unitOf(query)` | The unit the values are in, read from the query (see below) |
| `promqlArgs(input)` | The arguments a promql call took, to run it again |
| `rollForward(args, now)` | The same arguments over the same span, ending now |
| `serverOf(tool)`, `toolOf(tool)` | The server and tool `$.mcp.call` takes: `mcp__dash0-prod__promql` is `dash0-prod`, `promql` |
| `clockTime(ms, { seconds })`, `zoneOf(ms)` | `09:35` or `09:35:05` on the local clock; the zone, `UTC` or `GMT+2` |

## Units

The answer names no unit, so `unitOf` reads it from the query, by what Dash0's metrics are measured in:

| The query | Unit | Drawn as |
| --- | --- | --- |
| A duration: `dash0.spans.duration`, `*_seconds`, latency | `seconds` | `850 ms`, `1.2 s` |
| A duration times `1000` | `milliseconds` | `138 ms` |
| `*_bytes` | `bytes` | `3.2 GB` |
| `rate()` or `irate()` of anything else | `/s` | `12.5K/s` |
| A count, `increase()` | none | `12.5K` |

A duration rescaled any other way (`/ 60`) gets no unit rather than a wrong one.

## Live refresh

[live.js](live.js) keeps each result current, as a Dash0 chart's auto-refresh does:

- A `tool.call` hook keeps each promql call's arguments by `tool_use_id`. A `ToolGroup` call carries them itself.
- Every 30 seconds a live result runs its query again through the same server (`$.mcp.call`), over the same span ending now, and draws the answer.
- Only the 3 most recent results refresh. An older one stops and says `Snapshot · 09:35 (GMT+2)`.
- A refresh that fails keeps the last data and says so.

## Known risk

The markdown is the MCP's answer to Claude, not a contract: a renamed heading breaks this. The fix is for the Dash0 MCP to return `structuredContent` with an output schema beside the markdown.

## Tests

[promql.test.ts](promql.test.ts) mounts a sample answer as a `ToolResult` and as a folded `ToolGroup` on every surface, and checks the errored, the running and the unknown-shape cases fall back to Claude Code's own row.

## Beside it

- [catalog.js](catalog.js) reads `getServiceCatalog` into `{ services, link }`, leaving external dependencies out, and `getFailedChecks` into `{ checks, link }`, keeping only critical and degraded checks. Both read the first table only: `getFailedChecks` follows it with a Labels table copied from telemetry, which is never read.
- [overview.js](overview.js) holds the [Services Overview](../../components/pages/dash0-dashboard/dash0-dashboard.md)'s queries, each checked against the Dash0 MCP, and `loadOverview`, which asks them all at once and keeps a panel's last data when its query fails.
