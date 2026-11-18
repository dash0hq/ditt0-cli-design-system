# Heatmap

Where spans fell, by duration, over time: Dash0's Outliers view of its Tracing explorer. Slow outliers and failures stand out from the bulk at a glance.

Storybook: `Components/Charts/Heatmap` · Stories: `components-charts-heatmap--*`

## When not to use it

- **A few quantiles over time:** use [Timeseries](../timeseries/timeseries.md), a line each.
- **Counts per step, by status:** use [BarChart](../bar-chart/bar-chart.md).

## Quick start

```jsx
import { Heatmap } from '../components/molecules/charts/heatmap/heatmap.jsx'
import { BANDS, heatmapOf, extremesOf } from '../connectors/dash0/tracing.js'

const cells = heatmapOf(read.bands)
<Heatmap times={cells.times} bands={BANDS} ok={cells.ok} error={cells.error} {...extremesOf(read.extremes)} />
```

## Variants

A column per step, a row per duration band, the slowest at the top. The bands run on a log scale (0, 1 ms, 5 ms, 25 ms, 100 ms, 500 ms, 2.5 s, 10 s), so fast and slow spans both get rows. Each cell is shaded `░ ▒ ▓ █` by how many spans fell in it, on a log scale too, so a single span and a hundred thousand both show. A cell with any ERROR span is drawn in the error red, at least `▒`, over the OK & UNSET grey. Above the plot, the range's max and p99; under it, the time axis and the legend, with the shade scale up to the busiest cell.

<Canvas story="components-charts-heatmap--default" />

**Empty.** No spans: every cell is blank, and max and p99 read `no data`.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `times` | string[] | | A label per column |
| `bands` | `[{ lo }]` | | Each band's lower bound, lowest first: the y axis |
| `ok` | number[][] | | OK and UNSET spans, `[band][column]` |
| `error` | number[][] | | ERROR spans, `[band][column]` |
| `max`, `p99` | number \| null | `null` | The range's slowest span and p99, in `unit` |
| `unit` | string | `'seconds'` | The bands' unit, as [units](../../../foundations/units/units.md) writes it |

## Surfaces

Every surface. It fills the Box it sits in ([measure.js](../../../measure.js)): each column as wide as fits, 6 cells at most; 2 before it is measured, and on mobile. No hover card yet.

## Source of truth

- Dash0's Tracing explorer, Outliers chart. The data is `dash0.spans.duration`, a native histogram, cut into bands with `histogram_fraction` ([tracing.js](../../../../connectors/dash0/tracing.js) `bands`).
