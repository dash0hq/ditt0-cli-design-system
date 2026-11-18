# Legend

Which colour is which series, under a chart: a swatch in the series' colour, then its name.

Storybook: `Components/Charts/Legend` · Stories: `components-charts-legend--*`

## When not to use it

- **One panel per series (small multiples):** each panel is already headed by its series' name. Timeseries leaves the legend out there.
- **A bar per label, one series:** the labels under the bars name them.

## Quick start

```jsx
import { Legend } from '../components/atoms/legend/legend.jsx'

<Legend items={[{ name: 'p50', color: '#828aff' }, { name: 'p99', color: '#225584' }]} />
```

[Timeseries](../../molecules/charts/timeseries/timeseries.md) and [BarChart](../../molecules/charts/bar-chart/bar-chart.md) draw one by themselves. Use Legend alone for a chart you draw yourself.

## Variants

**Lines.** A `━` per series.

<Canvas story="components-charts-legend--default" />

**Many series.** The legend goes on to the next line when the row is full. A name longer than 24 characters is shortened in the middle, where two services' names differ least.

<Canvas story="components-charts-legend--many-series" />

**Bars.** A `█` per series. A stacked bar chart gives each item its own texture (`▓`, `▒`).

<Canvas story="components-charts-legend--bars" />

## Do and don't

**Do** keep the legend in the series' order, the order the chart draws them.

**Don't** colour the names. The swatch carries the colour; the name stays dim so the data stays brightest.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `items` | `[{ name, color, swatch }]` | required | One per series. `swatch` overrides the legend's for that item |
| `swatch` | string | `'━'` | The glyph for every item without its own: `━` lines, `█` bars |

## Surfaces

The same on every surface: text, wrapping to the width it has.

## Source of truth

- The longest name before it is shortened, and the gap between items, are in [legend.constants.js](legend.constants.js), which the [Go package](../../../go/README.md) reads too (generated into `constants_gen.go`).
- Dash0 shows a legend on most panels (`legend.show` is on for 84% of Dash0's own dashboards' time series panels).
- Truncation in the middle: TRUNC-002 in Dash0's content guidelines.
