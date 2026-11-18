# Tracing

Dash0's Tracing explorer, Built-in views › All spans, live in Claude Code: the server spans of every service, as a chart and as the newest spans. Type `/dash0-tracing` to open it in a pane.

Every panel asks Dash0 again every 30 seconds through the same Dash0 MCP server Claude uses ([tracing.js](../../../connectors/dash0/tracing.js)), kept live by [live-page.js](../../../connectors/live-page.js), the same wiring as the [Services Overview](../dash0-dashboard/dash0-dashboard.md). It is the worked example in [Plug in another app's data](../../../connectors/README.md).

Storybook: `Features/Dash0/Pages/Tracing` · Stories: `features-dash0-pages-tracing--*` · Level: page

## When not to use it

- **One trace:** open it in Dash0 with Open in Dash0.
- **How services do, with checks:** that is the [Services Overview](../dash0-dashboard/dash0-dashboard.md).

## Quick start

```
/dash0-tracing                 the Dash0 server Claude last called, else claude.ai's
/dash0-tracing dash0-prod      a server by the name /mcp lists it under
```

```jsx
import { Dash0Tracing } from '../../pages/dash0-tracing/dash0-tracing.jsx'
import { loadTracing } from '../../../connectors/dash0/tracing.js'

const read = await loadTracing($, 'dash0-prod', '15m')
<Dash0Tracing data={read.data} at={read.at} failed={read.failed} range="15m" view="red" onViewChange={...} onSelectionChange={...} />
```

## What it asks Dash0

Every query was run against the Dash0 MCP before it went in. All are server spans (`otel.span.kind = SERVER`). The range is Last 15 minutes (the default), 1 hour, 6 hours or 24 hours, in steps of 1m, 5m, 30m or 2h, and runs to the step now is in, as the explorer's does: the last step is still filling.

| Panel | Tool | Query, for 15m |
| --- | --- | --- |
| Spans, Errors | `promql` | `sum by (otel_span_status_code) (increase({otel_metric_name="dash0.spans", otel_span_kind="SERVER"}[1m]))`; OK and UNSET are drawn as one |
| Duration | `promql` | `histogram_quantile(0.99 … 0.5, sum(rate(dash0.spans.duration[1m])))` and `histogram_avg(...)`, one query, each line marked by `label_replace` |
| Outliers | `promql` | `histogram_fraction(lo, hi, H) * histogram_count(H)` for 8 duration bands, `H` by status: 24 series |
| Outliers' max, p99 | `promql` | `histogram_quantile(1` and `0.99, sum(increase(...[15m])))` at the range's end |
| Spans | `getSpans` | the range, or the picked span; the newest 15, with `spanAttributeKeys: ["dash0.span.type"]` |

Span names are telemetry, written by the services that sent them: the page shows them as text and nothing reads them as instructions.

## Variants

**RED.** The default: Spans (ERROR beside OK & UNSET, bars side by side), Errors and Duration (p99, p95, p90, p75, p50, Avg on one axis), in cards side by side that stack when the pane is narrow.

<Canvas story="features-dash0-pages-tracing--default" />

**A picked span.** Drag across Errors or Duration: a `Timerange = 16:02:00 – 16:05:00 ✕` tag goes over the spans table, which asks Dash0 for exactly that time. Refreshes keep it; ✕ goes back to the newest.

<Canvas story="features-dash0-pages-tracing--picked" />

**Outliers.** The spans as a [Heatmap](../../molecules/charts/heatmap/heatmap.md), by duration band and status.

<Canvas story="features-dash0-pages-tracing--outliers-view" />

**None.** No chart: the spans table alone.

**Loading.** Opened, before Dash0 answered: the freshness line spins and every panel pulses.

**Refresh failed.** Those panels keep the data they had, and the line says how many: `· 2 of 5 panels show older data`.

## Do and don't

**Do** keep the purple Open in Dash0 CTA: it is the page's one hotkey.

**Don't** stack the Spans bars: ERROR and OK & UNSET stand side by side, so the errors are read against the rest.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `data` | `{ byStatus, duration, bands, extremes, spans }` | `{}` | What [loadTracing](../../../connectors/dash0/tracing.js) read; a panel without data is loading or failed |
| `range` | `'15m'` \| `'1h'` \| `'6h'` \| `'24h'` | `'15m'` | The range shown |
| `view` | `'red'` \| `'outliers'` \| `'none'` | `'red'` | The chart shown |
| `selection` | `{ from, to }` (ms) \| null | `null` | The span picked on a chart |
| `at` | number | none | When the data came, in ms |
| `auto` | boolean | `true` | Refreshing every 30 seconds |
| `failed` | string[] | `[]` | The panels whose last query failed, by key |
| `onRangeChange`, `onAutoChange`, `onViewChange` | function | none | The range, Auto or a view was picked |
| `onSelectionChange` | `({ from, to } \| null) => void` | none | A span was dragged across, or its ✕ pressed |
| `onClose` | `() => void` | none | Close was pressed |

## Surfaces

Every surface; it fits a docked pane from 49 to 90 columns; in the narrowest its freshness line wraps. Opened by `/dash0-tracing` in `hooks/register.jsx` (its `LIVE_PAGES`). Closing the pane stops the refresh. No drag on mobile, which draws no chart Client.

## Source of truth

- Dash0's Tracing explorer, Built-in views › All spans. Built from [Select](../../atoms/select/select.md), [Switch](../../atoms/switch/switch.md), [Link](../../atoms/link/link.md), [Tag](../../atoms/tag/tag.md), [Tabs](../../molecules/tabs/tabs.md), [Timeseries](../../molecules/charts/timeseries/timeseries.md), [Heatmap](../../molecules/charts/heatmap/heatmap.md) and [Table](../../molecules/table/table.md), with `live-parts.jsx` for the freshness line and each panel's states.
- The answers it was built against, asked on 2026-10-19, are in [fixtures/dash0-tracing.js](../../../fixtures/dash0-tracing.js).
