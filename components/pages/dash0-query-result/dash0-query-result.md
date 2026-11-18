# Query Result

A Dash0 PromQL result under its tool call: the series as a chart, a purple ` Open in Dash0 ↗ ` link to the same query in the Dash0 app ([Link](../../atoms/link/link.md), `variant="cta"`), and a line saying how current the data is.

The chart draws the same data Dash0 does and keeps it current the way a Dash0 chart does. Every 30 seconds it runs the query again over the same span, ending now ([live.js](../../../connectors/dash0/live.js)). Times are the person's local time, as Dash0 shows them, and the freshness line names the zone (TIME-003).

Storybook: `Features/Dash0/Pages/Query Result` · Stories: `features-dash0-pages-query-result--*` · Level: page

## When not to use it

- **Data that isn't a PromQL answer:** build its own page on [Tool Result](../../templates/tool-result/tool-result.md).

## Quick start

It draws by itself when Claude calls the Dash0 MCP's `promql` tool. To draw it from a result you have:

```jsx
import { Dash0QueryResult } from '../../pages/dash0-query-result/dash0-query-result.jsx'
import { parsePromql } from '../../../connectors/dash0/promql.js'

<Dash0QueryResult result={parsePromql(output)} unit={unitOf(query)} />
```

The hooks module draws it with `live` and `onAutoChange` from [live.js](../../../connectors/dash0/live.js).

## Variants

**One series.** A query with no grouping, such as one percentile.

**By service.** A query grouped by a label: each series is named by its label values.

**Live.** The Auto-refresh switch is on and the query runs again every 30 seconds. The line reads `Updated 09:35:05 (GMT+2)`.

<Canvas story="features-dash0-pages-query-result--live" />

**Snapshot.** Auto-refresh is off, so the chart says which moment it shows: `Snapshot · 09:35 (GMT+2)`. Only the 3 most recent results refresh; an older one turns into a snapshot by itself. A transcript keeps every result, and Claude Code doesn't say when one scrolls out of sight.

<Canvas story="features-dash0-pages-query-result--snapshot" />

**Refresh failed.** The chart keeps the data it had and says so: `Couldn't refresh. Showing data from 09:35:05.` The next refresh tries again.

<Canvas story="features-dash0-pages-query-result--refresh-failed" />

## Do and don't

**Do** let Claude read the original table. The page changes only what the person sees.

**Don't** draw it for an errored call or one still running. The mount draws Claude Code's own row for those.

**Don't** show data without saying how current it is. A chart that stopped refreshing says `Snapshot`, never nothing.

## Accessibility

- The timeseries' hover card gives each value in words.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `result` | `{ series, times, link }` | required | What [the promql connector](../../../connectors/dash0/promql.md) reads from the answer |
| `unit` | string | `''` | What the values are in, for [units.js](../../foundations/units/units.js) to scale; `unitOf(query)` reads it from the query |
| `live` | `{ id, canRefresh, auto, at, failed }` | none | How current the data is: `at` is when it was fetched, in ms. `canRefresh` shows the Auto-refresh switch. Absent, there is no freshness line |
| `onAutoChange` | `(auto) => void` | none | The Auto-refresh switch was pressed |

## Surfaces

Every surface. Mounted at `ToolResult` and `ToolGroup` in `hooks/register.jsx`.

## Source of truth

- Built from [Tool Result](../../templates/tool-result/tool-result.md), [Timeseries](../../molecules/charts/timeseries/timeseries.md) and [Link](../../atoms/link/link.md).
- Planned: when series overlap past what a line chart can show, draw a bar chart instead.
