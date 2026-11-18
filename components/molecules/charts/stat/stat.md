# Stat

One number that matters, big: a request rate, an error percentage, a p99. Dash0's third most used panel, after the time series and its table.

Storybook: `Components/Charts/Stat` · Stories: `components-charts-stat--*`

## When not to use it

- **How the number moved over time, in detail:** use [Timeseries](../timeseries/timeseries.md). A Stat's sparkline shows the shape, not the values.
- **A share of a ceiling, such as disk used of 100 GB:** use [Gauge](../gauge/gauge.md).

## Quick start

```jsx
import { Stat } from '../components/molecules/charts/stat/stat.jsx'

<Stat label="api requests" values={rates} unit="/s" previous={rates[0]} compareLabel="vs 24h ago" />
```

## Variants

The value is the last one in `values` that isn't null, drawn in digits three rows tall, with its unit and magnitude (`/s`, `ms`, `K`) small beside the bottom row. The label is dim over it. Numbers go through [units.js](../../../foundations/units/units.js): `0.347` seconds reads `347 ms`.

<Canvas story="components-charts-stat--default" />

**Change.** Pass `previous` to show `▲` or `▼` with the change in percent, and `compareLabel` to name what it's compared with. The arrow is green when the change is good and red when it isn't: `goodWhen="up"` (the default) for rates and throughput, `goodWhen="down"` for latency and errors.

**Thresholds.** `thresholds: [{ value, color }]`, `color` a status (`warning`, `error`, `healthy`). The value, unit and sparkline take the colour of the last threshold the value reaches.

<Canvas story="components-charts-stat--thresholds" />

**Single.** `value` alone, without a series: no sparkline.

<Canvas story="components-charts-stat--single" />

**Small.** `size="small"`: one bold line, for a row of stats over a chart or on a narrow screen.

<Canvas story="components-charts-stat--row" />

**No data.** A missing value is a dim `no data`.

<Canvas story="components-charts-stat--no-data" />

## Do and don't

**Do** name what the number counts in `label`, including the service: "api requests", not "Requests".

**Don't** colour a value without thresholds. A colour says the value crossed a line.

## Accessibility

- The change says its direction with `▲` or `▼` as well as its colour.
- The big digits are drawn with box-drawing lines. A screen reader reads them as symbols, so put the value in the surrounding text too when the Stat is all a view shows.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | string | none | What the number counts, dim over it |
| `values` | `(number \| null)[]` | `[]` | The series, oldest first. The stat is the last value, the sparkline all of them |
| `value` | number \| null | the last of `values` | The stat, when there is no series |
| `unit` | string | `''` | A unit from units.js (`seconds`, `milliseconds`, `bytes`, `percent`, `ratio`, `decimal`), or text after the number (`/s`) |
| `previous` | number | none | The value to compare with, for `▲` or `▼` and the change |
| `compareLabel` | string | `'vs previous'` | What `previous` is, such as `vs 1h ago` |
| `goodWhen` | `'up'` \| `'down'` | `'up'` | Which way the change is good: green, else red |
| `thresholds` | `[{ value, color }]` | `[]` | The value takes the status colour of the last one it reaches |
| `size` | `'large'` \| `'small'` | `'large'` | Digits three rows tall, or one bold line |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Big digits, change, sparkline | The same | The same; use `size="small"` in a row |

## Source of truth

- The big digits, the sparkline's eighths and its width are in [stat.constants.js](stat.constants.js), which the [Go package](../../../../go/README.md) reads too (generated into `constants_gen.go`). Change them there.
- Dash0's Stat panel (the dashboard Stat widget): one value, its unit, thresholds colouring it. Units follow the content guidelines, UNIT-001 and UNIT-002.
