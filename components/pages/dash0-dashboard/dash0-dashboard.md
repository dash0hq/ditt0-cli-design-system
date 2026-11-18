# Services Overview

The page people keep open in Dash0 while something is on fire, live in Claude Code. It shows how the services are doing over a range: request rate, error rate and p95 latency as Stats; requests by service and spans by status as charts; the checks failing now; and the busiest services with their health. Type `/dash0-dashboard` to open it in a pane.

Every panel asks Dash0 again every 30 seconds, as a Dash0 dashboard does, through the same Dash0 MCP server Claude uses ([overview.js](../../../connectors/dash0/overview.js)). Each panel links to its own view in Dash0, so a number here can be checked there.

Storybook: `Features/Dash0/Pages/Services Overview` · Stories: `features-dash0-pages-services-overview--*` · Level: page

## When not to use it

- **One query Claude ran:** that draws by itself as a [Query Result](../dash0-query-result/dash0-query-result.md) under the tool call.
- **One service:** the Services catalog in Dash0 has its breakdown. Open it from the Services table.

## Quick start

```
/dash0-dashboard                 the Dash0 server Claude last called, else claude.ai's
/dash0-dashboard dash0-prod      a server by the name /mcp lists it under
```

To draw it from data you have:

```jsx
import { Dash0Dashboard } from '../../pages/dash0-dashboard/dash0-dashboard.jsx'
import { loadOverview } from '../../../connectors/dash0/overview.js'

const read = await loadOverview($, 'dash0-prod', '1h')
<Dash0Dashboard data={read.data} at={read.at} failed={read.failed} range="1h" auto onRangeChange={...} onAutoChange={...} />
```

## What it asks Dash0

Every query was run against the Dash0 MCP before it went in. Requests are server spans, as Dash0's RED metrics count them. The range is 15m, 1h (the default), 6h or 24h, in steps of 1m, 5m, 30m or 2h: about a dozen bars.

| Panel | Tool | Query, for 1h |
| --- | --- | --- |
| Requests | `promql` | `sum(rate({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[5m]))` |
| Error rate | `promql` | `100 * sum(rate(` the same, with `otel_span_status_code="ERROR"` `[5m])) / sum(rate(` all `[5m]))` |
| P95 latency | `promql` | `histogram_quantile(0.95, sum by (le) (rate({otel_metric_name="dash0.spans.duration", otel_span_kind="SERVER"}[5m])))` |
| Requests by service | `promql` | `sum by (service_name) (rate(...[5m])) and on (service_name) topk(8, sum by (service_name) (rate(...[1h] @ end())))` |
| Spans by status | `promql` | `sum by (otel_span_status_code) (increase(...[5m]))` |
| Failed checks | `getFailedChecks` | the last hour, critical and degraded, up to 50; resolved ones are left out |
| Services | `getServiceCatalog` | the range, busiest first, 10, without external dependencies |

**The newest minutes wait.** A step's spans keep arriving for minutes after it ends: one step read 91% of its rate 8 minutes later. A chart ending now would dip at the end when nothing dipped. So each range ends 10 minutes ago, on a step, and every step drawn is whole. The subtitle says which span it is and says so.

**The same 8 services at every step.** The services chart takes the 8 busiest over the whole range (`@ end()`), so a service never drops in and out of the chart and leaves gaps. The MCP answers at most 30 series, so the top is picked by Dash0, not here.

## Variants

**Live.** The default: every panel drawn, `Updated 14:15:00 (GMT+2)` under the controls.

<Canvas story="features-dash0-pages-services-overview--default" />

**Loading.** Opened, before Dash0 answered: each panel says `Loading…`. Changing the range starts here too, so a range never shows another range's data.

**Snapshot.** Auto-refresh off: `Snapshot · 14:15 (GMT+2)`, and nothing is asked until it is on again.

**Refresh failed.** Some queries failed: those panels keep the data they had, and the line says how many: `Updated 14:15:00 (GMT+2) · 2 of 7 panels show older data`.

<Canvas story="features-dash0-pages-services-overview--refresh-failed" />

**Panel failed.** A query that never answered: its place shows an error and the rest draw.

**All passing.** No check failing: the Failed checks panel says so.

## Do and don't

**Do** keep each panel's Open in Dash0 link. It opens the same query over the same span.

**Don't** draw the newest step while its spans arrive. It reads as a drop.

**Don't** leave old data unmarked. A panel that couldn't refresh is counted in the freshness line.

## Accessibility

- Every Stat writes its value with its unit and how it moved, in words and with ▲ or ▼.
- Health and check status are Badges: a word as well as a colour.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `data` | `{ requests, errors, p95, byService, byStatus, services, checks }` | `{}` | What [loadOverview](../../../connectors/dash0/overview.js) read; a panel without data is loading or failed |
| `range` | `'15m'` \| `'1h'` \| `'6h'` \| `'24h'` | `'1h'` | The range shown |
| `at` | number | none | When the data came, in ms; none while loading |
| `auto` | boolean | `true` | Refreshing every 30 seconds |
| `failed` | string[] | `[]` | The panels whose last query failed, by key |
| `onRangeChange` | `(range) => void` | none | A range was pressed |
| `onAutoChange` | `(auto) => void` | none | The Auto-refresh switch was pressed |

## Surfaces

Every surface. Opened by `/dash0-dashboard` in `hooks/register.jsx`, as the `dash0-dashboard` pane. Closing the pane stops the refresh.

## Source of truth

- Built from [Heading](../../atoms/heading/heading.md), [Chart Controls](../../molecules/chart-controls/chart-controls.md), [Switch](../../atoms/switch/switch.md), [Stat](../../molecules/charts/stat/stat.md), [Chart Card](../../organisms/chart-card/chart-card.md), [Timeseries](../../molecules/charts/timeseries/timeseries.md), [Failed Checks](../../organisms/failed-checks/failed-checks.md) and [Services](../../organisms/services/services.md).
- The answers it was built against are in [fixtures/dash0-overview.js](../../../fixtures/dash0-overview.js), read by [catalog.js](../../../connectors/dash0/catalog.js) and [promql.js](../../../connectors/dash0/promql.js).
- Planned: Dash0's own dashboards, once the MCP can read their panels. Today it lists them but not what is in them.
