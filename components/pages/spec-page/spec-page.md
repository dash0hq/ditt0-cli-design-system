# Spec Page

A page described as plain JSON, a `Ditt0Page`, and drawn from Ditt0 components. Another mod opens one with `await $.ditt0.open(spec)`, and Claude opens one with the `ditt0_show` tool. Each page gets its own pane, `ditt0-page-<id>`. A block with a `promql` or `query` asks Dash0 when the page opens, then again every 30 seconds, through [live-page.js](../../../connectors/live-page.js). A block can also carry its own data, and the mod that opened the page pushes new data with `$.ditt0.update`. A [Perses](https://perses.dev) dashboard, such as one exported from Dash0, opens as a spec page too: see [Perses dashboards](#perses-dashboards).

The contract, every type included, is [types/index.d.ts](../../../types/index.d.ts). The connector is [connectors/spec-page.js](../../../connectors/spec-page.js).

Storybook: `Features/Ditt0/Pages/Spec Page` · Stories: `features-ditt0-pages-spec-page--*` · Level: page

## When not to use it

- **A page this library ships**, such as the [Services Overview](../dash0-dashboard/dash0-dashboard.md) or [Tracing](../dash0-tracing/dash0-tracing.md). Open those by their commands.
- **Interaction beyond range, Auto-refresh, line type and zoom**, such as picking a span or switching views. Write a page component and a live-page spec ([connectors/README.md](../../../connectors/README.md)).
- **One query Claude ran.** Its result draws by itself as a [Query Result](../dash0-query-result/dash0-query-result.md) under the tool call.

## Quick start

From another mod. List `"dependencies": ["ditt0-cli-design-system"]` in its `plugin.json`, then:

```js
const { id, opened } = await $.ditt0.open({
    id: 'checkout',
    title: 'Checkout',
    range: '1h',
    blocks: [
        { type: 'stats', items: [{ label: 'Error rate', unit: 'percent', goodWhen: 'down', promql: '100 * sum(rate({otel_metric_name="dash0.spans", service_name="checkout", otel_span_status_code="ERROR"}[$step])) / sum(rate({otel_metric_name="dash0.spans", service_name="checkout"}[$step]))' }] },
        { type: 'timeseries', id: 'queue', title: 'Jobs in queue', series: [{ name: 'jobs', values: [3, 5, 4] }], times: ['10:00', '10:01', '10:02'] },
        { type: 'link' },
    ],
})
await $.ditt0.update({ id: 'checkout', data: { queue: { series: [{ name: 'jobs', values: [5, 4, 7] }], times: ['10:01', '10:02', '10:03'] } } })
await $.ditt0.close({ id: 'checkout' })
```

[examples/hello-ditt0](../../../examples/hello-ditt0) is a whole mod that does this.

To draw it in this plugin from data you already have:

```jsx
import { SpecPage } from '../../pages/spec-page/spec-page.jsx'
import { normalizeSpec, inlineOf } from '../../../connectors/spec-page.js'

const { spec } = normalizeSpec(input)
<SpecPage spec={spec} data={inlineOf(spec)} at={Date.now()} />
```

## Blocks

Each block maps to one component. A block with an `id` can get new data later. A block without one is keyed by its place: `b0`, or `b2.1` inside a row.

| `type` | Draws | Fields |
| --- | --- | --- |
| `heading` | [Heading](../../atoms/heading/heading.md) | `text`, `level` (`h1`, `h2`, `h3`; default `h3`) |
| `text` | [Text](../../atoms/text/text.md), wrapping in a narrow pane | `text`, `color` (`subtle`, `error`, `warning`, `info`, `healthy`, ...) |
| `markdown` | Markdown, as the surface draws it | `text`, `title` |
| `stats` | A row of [Stat](../../molecules/charts/stat/stat.md)s, one per series when an item's query answers several | `items`: `{ id?, label, unit?, goodWhen?, calculation?, thresholds?, promql? \| queries? \| query? \| value? \| values? }` |
| `gauge` | A [Gauge](../../molecules/charts/gauge/gauge.md) per series, in a card | `title`, `unit`, `calculation`, `min` (default 0), `max` (default 100 for `percent`, 1 for `ratio`, else a round number over the values), `thresholds`; `promql`, `queries`, or inline `value` or `series` |
| `timeseries` | [Timeseries](../../molecules/charts/timeseries/timeseries.md) in a card, with its own Dots / Lines / Bars and zoom | `title`, `subtitle`, `unit`, `lineType`, `stacked`; `promql`, `query`, or inline `series` and `times` |
| `bars` | [BarChart](../../molecules/charts/bar-chart/bar-chart.md) in a card | `title`, `alt`, `unit`, `orientation`, `stacked`, `calculation`; inline `bars` or `series` and `labels`, or a `promql` (one bar per series, at its last sample) |
| `pie` | [PieChart](../../molecules/charts/pie-chart/pie-chart.md) in a card, or [SquareChart](../../molecules/charts/square-chart/square-chart.md) with `variant: 'squares'` | `title`, `unit`, `variant`, `calculation`; inline `slices: { label, value }[]`, or a `promql` (a slice per series at its last sample: `sum by (otel_span_kind) (…)`) |
| `gantt` | [GanttChart](../../molecules/charts/gantt-chart/gantt-chart.md) in a card | `title`; inline `tasks: { label, section?, start, end?, milestone? }[]` |
| `diagram` | [FlowDiagram](../../molecules/flow-diagram/flow-diagram.md) in a card | `title`, `source`: Mermaid (flowchart, sequence, state, class) |
| `table` | [Table](../../molecules/table/table.md) | `title`; inline `columns` and `rows` (cells: text, `{ text, badge }` or `{ text, status }`), a `promql` or `queries` (a row per series: its name and one value, by `calculation`), or `spans: { filters?, limit?, sort? }`, the newest spans from `getSpans` (`sort: 'slowest'` puts the longest first) |
| `badge` | [Badge](../../atoms/badge/badge.md) | `label`, `color` |
| `tags` | A row of [Tag](../../atoms/tag/tag.md)s | `tags`: `{ label, value }[]` |
| `link` | [Link](../../atoms/link/link.md) | `href` (default: the first Dash0 link the page read), `label` (default `Open in Dash0`). The first link is the CTA; any later one is a plain link |
| `row`, `column` | Blocks side by side (wrapping when the pane is narrow), or stacked | `blocks` |
| `card` | A dim rounded card with a title | `title`, `subtitle`, `blocks` |

**Data from Dash0.** `promql` is a Dash0 PromQL query. Its time range and step come from the page's range, and it ends on the range's last whole step, as on the Services Overview (`windowOf`). Write `[$step]` as the rate window: it becomes `[5m]` for `1h`. `$__rate_interval`, `$__interval`, `$__interval_ms`, `$__range`, `$__range_s` and `$__range_ms` work too, as do their `${…}` forms. `query: { tool, args }` is any call to the page's server whose tool has a parser in `DASH0_PARSERS`: `promql`, `getSpans`, `getServiceCatalog`, `getFailedChecks`. A call to any other tool reads as failed. The page's `dataset` (default `default`) goes into every query that names none.

**Several queries in one block.** `queries: [{ promql, name? }]` asks each and draws every series together, as a Perses panel does. `name` is a template: `{{service_name}}` puts each series' label in, and a series whose label is missing keeps its own name. When one of the queries fails the others still draw, and the freshness line counts the block once.

**One value from a series.** `calculation` is how a stat, gauge, pie slice, bar or table row reads a series: `last` (default, the last number), `first`, `last-number`, `first-number`, `mean`, `sum`, `min`, `max`. `thresholds: [{ value, color }]` colours a stat or gauge once its value reaches each one (`color`: `healthy`, `warning`, `error`, `info`, `debug`, `unknown`).

**No data.** An answer with no series, or only blank samples, is not a failure: the chart says *No data in this time range.* and a stat says *no data*.

**Data of a mod's own.** Inline fields: `series` and `times`, `bars`, `slices`, `tasks`, `rows`, `value` or `values`. `$.ditt0.update({ id, data: { <block id>: ... } })` replaces them, in the same shapes. `blocks` in an update replaces the page's blocks, and data already pushed stays with each block id.

## Variants

**Live from Dash0.** A mini Tracing page made of blocks: RED stats, the rate and error charts side by side, p95, and the newest error spans. The range picker and the Auto-refresh switch show when at least one block asks Dash0.

<Canvas story="features-ditt0-pages-spec-page--default" />

**A mod's own data.** Nothing is asked, so the page shows no range picker and no Auto-refresh. Its time is when the mod last pushed data.

<Canvas story="features-ditt0-pages-spec-page--inline" />

**Parts, timelines and diagrams.** `pie` (round, or `variant: 'squares'`), `gantt` and `diagram` blocks, all inline.

<Canvas story="features-ditt0-pages-spec-page--shapes" />

**Loading.** One spinner for the page, and a pulse in each block that is waiting for an answer.

<Canvas story="features-ditt0-pages-spec-page--loading" />

**A query that failed.** Its block says so. The other blocks draw, and the freshness line counts the failed one.

<Canvas story="features-ditt0-pages-spec-page--panel-failed" />

**A Perses dashboard.** A Dash0 dashboard with its variables at the top, a Markdown note, stats with a mean and thresholds, charts named by `{{service_name}}`, a pie, a table, and the two panels that stay in Dash0, each saying why.

<Canvas story="features-ditt0-pages-spec-page--perses" />

**A Perses dashboard with no data.** A node-exporter dashboard asked of a dataset without those metrics: every panel draws and says so, and nothing reads as failed.

<Canvas story="features-ditt0-pages-spec-page--perses-no-data" />

## Perses dashboards

A [Perses](https://perses.dev) dashboard opens as a spec page, so a dashboard exported from Dash0 or Perses becomes a live pane. [connectors/perses.js](../../../connectors/perses.js) (`persesPage`) turns it into blocks.

- **Opening one.** The person runs `/ditt0-perses <file> [variable=value …]` on a JSON or YAML file (`service=checkout,frontend` picks several, `service=*` all, `server=dash0-prod` names the MCP server). Claude passes it to `ditt0_show` as `perses`, with `variables`. A mod passes it to `$.ditt0.open({ perses, variables })`. Any field given beside `perses` (`id`, `title`, `range`, `blocks`, …) wins over the dashboard's own.
- **What it reads.** A `PersesDashboard`, a bare `{ kind: 'Dashboard', spec }`, Dash0's stored `{ dashboard, report }`, or an object under `persesDefinition`. Its `duration` becomes the range and its `refreshInterval` the refresh.
- **Layout.** Each `Grid` is a section headed by its title, collapsed or not. Its panels go in rows by `y`, left to right by `x`, side by side as a `row`; stats in one row join into one stats block. A panel no layout places goes at the end.
- **Panels.** `TimeSeriesChart` → `timeseries` (`display: bar` → bars, stacked kept), `StatChart` → `stats`, `GaugeChart` → `gauge`, `PieChart` → `pie`, `BarChart` → horizontal `bars`, `Table` and `TimeSeriesTable` → `table`, `Markdown` → `markdown`. The calculation, the unit (`format`, converted: nanoseconds to seconds, `percent-decimal` to `ratio`, `bytes/sec` to `bytes/s`) and thresholds come along.
- **Queries.** `PrometheusTimeSeriesQuery` runs as `promql`, its `seriesNameFormat` naming each series. Every other kind, such as Dash0's spans and logs queries, and every panel a terminal can't draw (`SpanTable`, `HeatMapChart`, `LogsTable`, …) becomes a card saying so, and is listed in the answer's `problems`.
- **Variables.** A tags block at the top shows each one's value. A value given wins; else the variable's default, a static list's first value, or All. In a label matcher one value goes in as written; several, or All, turn `=` into `=~` (and `!=` into `!~`) with each value escaped. A regex built from a variable is anchored, `^(checkout|frontend)$`: Prometheus anchors a regex matcher, but Dash0 matches it anywhere in a value (`=~"search"` matches `agents-worker` there). A regex written into the dashboard with no variable is left as written. Formats `regex`, `pipe`, `csv`, `json` and `singlevariablevalue` work, as do `$v`, `${v}` and `[[v]]`. Dash0's filter variable is left out: its filters live in Dash0.
- **Said, not dropped.** A log scale (drawn linear), a 100% stack (stacked by value), a variable the dashboard lacks, and anything above come back in `problems`, each starting `perses: `.

```js
const { opened, problems } = await $.ditt0.open({ perses: dashboardJson, variables: { service: ['checkout', 'frontend'] } })
```

## Do and don't

- Do give every block you will update an `id`.
- Do open a Perses dashboard with `perses`, not by rewriting its panels as blocks: the variables, layout and units come along, and what stays in Dash0 is said.
- Do pass raw values in their base unit, and the `unit`. The page scales them (`850 μs`, `3.2 GB`).
- Do use `null` for a missing value, never `0`.
- Don't send colours. Cells take a `badge` or a `status`, and text takes a `color` name. A hex is dropped.
- Don't add more than one `link` meant as the CTA. Only the first one is drawn purple.
- Don't send functions or element trees. Only JSON crosses, and anything else is dropped.

## Accessibility

Every control is a Button: the range options, Auto, each chart's line type and zoom, and Close. Tab and Enter reach them. Badges carry a word as well as a colour. Times are local, 24-hour, with the zone.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `spec` | normalized `Ditt0Page` | required | The page, from `normalizeSpec`: each block with its `key` |
| `data` | `{ [key]: read }` | `{}` | Each block's data: what its query read, or what it carries |
| `range` | `'15m' \| '1h' \| '6h' \| '24h'` | `'1h'` | The range shown |
| `at` | ms or null | `null` | When the data came: from Dash0, or from the mod's last push |
| `auto` | boolean | `true` | Auto-refresh |
| `failed` | `string[]` | `[]` | The keys of queries whose last answer failed: a block's own, or `<key>~<n>` for its `queries` |
| `refreshing` | boolean | `false` | A refresh is asking now |
| `onRangeChange`, `onAutoChange`, `onClose` | functions | none | As every live page's ([live-page.js](../../../connectors/live-page.js)) |

## Surfaces

Terminal, desktop, VS Code and mobile. On mobile the charts draw at their natural width and have no zoom.

## Source of truth

The blocks are this library's own components; see each one's doc. The spec is Ditt0's and has no counterpart in Dash0's Storybook. It follows the shape of a Dash0 dashboard panel (a query, or data, and how to draw it). Dash0's panel options that a terminal can't draw are left out. Perses dashboards are read as the [Perses spec](https://perses.dev/perses/docs/api/dashboard/) writes them, and as Dash0 stores them.
