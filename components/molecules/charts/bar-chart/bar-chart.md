# BarChart

Bars that compare a few values side by side, such as p99 latency by hour, or requests per second by service.

Storybook: `Components/Charts/BarChart` · Stories: `components-charts-barchart--*`

## When not to use it

- **Values over time, many samples:** use [Timeseries](../timeseries/timeseries.md).
- **One number:** write it as [Text](../../../atoms/text/text.md).

## Quick start

```jsx
import { BarChart } from '../components/molecules/charts/bar-chart/bar-chart.js'

<BarChart
    bars={[{ label: '03:00', value: 291 }, { label: '04:00', value: 399 }]}
    unit="ms"
    alt="p99 latency by hour: 03:00 291 ms, 04:00 399 ms"
/>
```

## Variants

Bars without a colour take the [Color Manager](../../../foundations/color-manager/color-manager.md)'s colour for their label, or for their series' name, so `api` is the same colour here as in a line chart.

**Vertical.** The default: a column per bar, growing up from zero, its label under it. A y axis and dim dashed gridlines give the scale, as on the line chart; a gridline's label is the value at the middle of its row, so a bar of exactly that value ends on the dashes. Hovering a bar lights it, its colour moved 30% toward the text colour rather than to white, and shows a card with its exact value. Use it when the labels are short and in order, such as hours or latency buckets, so the eye reads them left to right. A column is at most 10 cells wide, so longer labels are cut with an ellipsis.

<Canvas story="components-charts-barchart--default" />

```jsx
<BarChart bars={byHour} unit="ms" alt="p99 latency by hour: ..." />
```

**Horizontal.** One row per bar, growing to the right, its value beside it. Use it when labels are long, such as service names, or when the bars rank things, largest first. A row has room for any label.

<Canvas story="components-charts-barchart--horizontal" />

```jsx
<BarChart orientation="horizontal" bars={byService} unit="/s" alt="Requests per second by service: ..." />
```

**Grouped.** Pass `series` and `labels` instead of `bars`: a bar per series at every label, side by side, to compare the series at each point. Groups stand three cells apart and the bars in a group one, so each group reads as one. A legend under the chart names the colours. Hovering a group shows a card with every series' value there. Bars in a group keep their colours on hover, since the colour tells them apart. Works in both orientations: horizontal draws a row per series under each label.

<Canvas story="components-charts-barchart--grouped" />

```jsx
<BarChart
    labels={['03:35', '04:05', '04:15']}
    series={[{ name: 'p95', values: [109, 130, 120] }, { name: 'p99', values: [291, 399, 547] }]}
    unit="ms"
    alt="p95 and p99 latency: ..."
/>
```

**Stacked.** `grouping="stacked"` draws the series one on another: one bar per label, as tall as their total. Use it when the series add up to a meaningful total, such as requests per service. Segments touch, so colour alone can't part them: each also wears a texture, solid `█` at the bottom, then `▓`, `▒`, `░`, shown again in the legend and the cards. On desktop and mobile, segments above the first are hatched. In a vertical terminal chart, where a segment ends inside a cell, the cell shows its eighths in its colour on the next segment's colour, so even a segment thinner than a row shows. Two segments that both end in one cell show as one there; the legend and the hover card still carry both.

<Canvas story="components-charts-barchart--stacked" />

```jsx
<BarChart grouping="stacked" labels={times} series={requestsByService} unit="/s" alt="Requests per second by service: ..." />
```

## Examples

Harder cases, each worked out from the sample data in `fixtures/`: every value is a window's mean.

**Three quantiles a group.** api's p50, p95 and p99 by hour. p50, under 1 ms beside p99's 400, is too small to draw to scale, so it is drawn as the thinnest bar there is, a one-eighth line `▁` at the axis (one unit high in the SVG): it reads as small, not missing. It keeps its place in the legend and its value in every card.

<Canvas story="components-charts-barchart--grouped-quantiles" />

**Many series.** Five services every 4 hours: 30 bars in six groups. The columns narrow to share the width and the legend wraps. Short of room even at a cell a bar, the bars of a group touch, then the groups close to two cells apart, then one, so no row ever runs past the Box and wraps. Below that (here 41 cells: a cell a bar, one between groups, the axis) put fewer groups in the chart.

<Canvas story="components-charts-barchart--grouped-many-series" />

**Grouped, horizontal.** The same five services, the first 4 hours of the day beside the last: a label per service with a row per window, so long names fit.

<Canvas story="components-charts-barchart--grouped-horizontal" />

**Stacked, more series than textures.** Six services stacked: the fifth and sixth wear the first textures again, and their colours tell them apart.

<Canvas story="components-charts-barchart--stacked-many-series" />

**Stacked by status.** api's ERROR spans under its OK ones, horizontal. The span status attribute makes ERROR the error red, whatever its place in the list.

<Canvas story="components-charts-barchart--stacked-status" />

**Gaps.** Two services that stopped reporting for part of the day: a window with no samples draws no bar, and its card says "no data", never a zero.

<Canvas story="components-charts-barchart--grouped-gaps" />

## Size

The chart fills the width of the Box it sits in, less two empty cells on the right, so it never touches the edge. Size it with its container: a card, a column, a pane. There is no width prop.

- **Vertical, terminal:** the columns widen to share the width, a cell between each, three between groups of several bars. A column is an odd number of cells, so its tick and label sit in its middle. Too narrow a Box, and the columns stay as wide as their labels need.
- **Horizontal, terminal:** the longest bar runs to two cells short of the end of the Box, after its label and value.
- **Desktop and mobile:** the SVG takes its slot's width, 160 pixels tall.

How: the chart draws a measure region ([measure.js](../../../measure.js)), a `Client` as wide as the Box that draws nothing and reports its width. The first draw, before it reports, is as wide as the labels need. A chart on mobile, which has no `Client`, stays that wide.

## Units

`unit` is written after every value shown: the horizontal bar's value, the hover card, the desktop tooltip. A vertical chart also writes it once above its y axis. The category axis (times, names) never has a unit.

It scales to the values' size ([Units](../../../foundations/units/units.md)), one scale for the chart from its largest value (UNIT-002): bytes read `GB`, seconds under one read `ms`, a space before the abbreviation (`547 ms`).

- Set `unit` whenever the values are not plain counts. Without it, `200` could be ms, MB or req/s.
- Pass values in the base unit and let the chart scale: `'bytes'`, `'seconds'` (or `'ms'` for milliseconds), `'percent'`, `'ratio'`, `'decimal'`. Any other `unit` follows the number as it stands, and counts take K from 10,000.
- Name the measure in the title or `alt` (`p99 latency`), not the unit (`Latency (ms)`). The unit belongs in `unit`.
- OpenTelemetry metric units: `By` is bytes and scales as `'bytes'`; `1` is a plain count, leave `unit` out; drop the braces from `{requests}/s`, write `/s`.

**Legend.** With several series, a [Legend](../../../atoms/legend/legend.md) names each under the chart: a stacked segment's swatch is its texture.

## Do and don't

**Do** write `alt` as the values themselves, with the unit. It is the chart for anyone who can't see it.

**Don't** use more than about seven labels. Past that, a table reads faster.

**Don't** group more than four series. The bars get too thin to compare: draw a chart per series, or fold the smallest into "Other".

**Don't** stack series that don't add up, such as percentiles or averages. Group them.

**Don't** put two units in one chart. There is one value axis: draw a chart per unit.

**Do** pick horizontal for service names. In a vertical chart they get cut to 10 cells, and `fulfillment-queue-worker` reads as `regional-…`.

**Don't** pick vertical for bars that aren't in an order. Columns side by side read as a sequence.

## Accessibility

- `alt` is required, and read out on desktop and mobile.
- In the terminal, a horizontal bar shows its value beside it, and a vertical bar's hover card shows it, so nothing is colour alone.
- Grouped and stacked charts draw a legend, and their cards name each series beside its value.
- Stacked segments carry a texture as well as a colour, so they part for anyone who can't tell the colours apart.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `bars` | `{ label, value, color?, attributes? }[]` | required without `series` | One bar per label, in order |
| `series` | `{ name, values, color?, attributes? }[]` | none | Instead of `bars`: a bar per series at every label, `values` in `labels`' order. `null` is no data |
| `labels` | string[] | required with `series` | A label per group |
| `alt` | string | required | The chart in words |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Which way the bars grow: up, or right |
| `grouping` | `'grouped' \| 'stacked'` | `'grouped'` | With `series`: side by side, or one on another |
| `unit` | string | `''` | Scales with the values (`'bytes'`, `'seconds'`, `'ms'`, `'percent'`, ...), or any text after the number. After every value shown, and above a vertical chart's y axis |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Vertical | Columns in eighth-height blocks filling the Box's width, the unit above the y axis, dashed gridlines, label centred under, a hover card per bar or group | An SVG of columns as wide as its slot, a tooltip per bar | An SVG of columns as wide as its slot |
| Horizontal | A row of blocks per bar, the longest to the Box's edge, with its value and unit | An SVG of rows as wide as its slot, a tooltip per bar | An SVG of rows as wide as its slot |
| Grouped, stacked | As above, with a legend under the chart; stacked segments textured | The SVG, with a legend under it; stacked segments hatched | The SVG, with a legend under it; stacked segments hatched |

## Source of truth

- `orientation` takes Dash0's name and values: `"vertical" | "horizontal"`, as on its funnel chart. The default here is `"vertical"`.
- `series`, `labels` and `unit` follow [Timeseries](../timeseries/timeseries.md)'s `series`, `times` and `unit`, so a query result can draw as either.
- Colours: Dash0's color manager, through [color-manager.js](../../../foundations/color-manager/color-manager.js).
