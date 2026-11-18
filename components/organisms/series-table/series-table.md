# SeriesTable

Each series of a chart as a row with its current value, mean and max, like Dash0's time series table panel.

Storybook: `Components/Data/SeriesTable` · Stories: `components-data-seriestable--*`

## When not to use it

- **Rows that aren't series:** use [Table](../../molecules/table/table.md).
- **One series, one number:** use [Stat](../../molecules/charts/stat/stat.md).

## Quick start

```jsx
import { SeriesTable } from '../components/organisms/series-table/series-table.jsx'

<SeriesTable series={requestRates} unit="/s" />
```

## Variants

A row per series, the highest current value on top. A swatch `━━` in the colour the series has in a line or bar chart, its name, then its figures, right-aligned. Each column shares one unit (UNIT-002), so `0.64 ms` sits over `100 ms`, not `640 μs`. Under a chart it doubles as a legend with values.

<Canvas story="components-data-seriestable--default" />

**Figures.** `stats` picks the columns, in order, from `current`, `mean`, `min` and `max`.

<Canvas story="components-data-seriestable--latency" />

## Do and don't

**Do** pass the same `series` the chart above it draws, so the colours match.

## Accessibility

- The series' name is in every row. The swatch only links it to the chart.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `series` | `[{ name, values, color, attributes }]` | required | As Timeseries takes them, values oldest first |
| `unit` | string | `''` | As units.js formats it, one unit per column |
| `stats` | `('current' \| 'mean' \| 'min' \| 'max')[]` | `['current', 'mean', 'max']` | The figures' columns |
| `palette` | string | `'auto'` | The Dash0 palette for series without a colour |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | [Table](../../molecules/table/table.md) | The same | The same |

## Source of truth

- Dash0's TimeSeriesTable panel, the second most used panel kind on Dash0's own dashboards.
