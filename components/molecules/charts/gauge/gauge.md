# Gauge

How full something is between a floor and a ceiling: memory used of 8 GB, CPU of 100%, error budget left.

Storybook: `Components/Charts/Gauge` · Stories: `components-charts-gauge--*`

## When not to use it

- **A number without a ceiling, such as requests per second:** use [Stat](../stat/stat.md).
- **The parts of a whole:** use [PieChart](../pie-chart/pie-chart.md), or [SquareChart](../square-chart/square-chart.md) when the exact share matters.

## Quick start

```jsx
import { Gauge } from '../components/molecules/charts/gauge/gauge.jsx'

<Gauge label="Memory used" value={7.4e9} max={8e9} unit="bytes" thresholds={[{ value: 5.6e9, color: 'warning' }, { value: 7.2e9, color: 'error' }]} />
```

## Variants

A row of squares rather than an arc: a terminal can't draw a round dial, and a straight meter reads more exactly. Filled squares `■` up to the value, dim `□` after, then the value and unit. Under the meter the min and max, dim.

<Canvas story="components-charts-gauge--default" />

**Thresholds.** The filled squares take the status colour of the last threshold the value reaches, and each threshold's place is ticked `╵` in its colour under the meter. Without thresholds the squares are Dash0's CTA purple.

<Canvas story="components-charts-gauge--thresholds" />

<Canvas story="components-charts-gauge--budget" />

**Stacked.** Several gauges, one under another, with a narrower `width`.

<Canvas story="components-charts-gauge--stacked" />

**No data.** All squares dim, the value `no data`.

<Canvas story="components-charts-gauge--no-data" />

## Do and don't

**Do** set `max` to the real ceiling (the limit, the quota), not the highest value seen.

**Don't** use a gauge for a value that can pass its max. It stops at full and hides how far past it went.

## Accessibility

- The value is written after the meter, so the squares never carry it alone. Thresholds are ticked by place as well as colour.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | string | none | What it measures, dim over it |
| `value` | number \| null | required | The reading |
| `min`, `max` | number | `0`, `100` | The ends of the meter |
| `unit` | string | `''` | As units.js formats it |
| `thresholds` | `[{ value, color }]` | `[]` | Status colours by value, ticked under the meter |
| `width` | number | `30` | Squares in the meter |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | `■■■□□ 42%` | The same | The same; narrow `width` in a stack |

## Source of truth

- Dash0's Gauge panel: a value between min and max, coloured by thresholds. Status colours from Dash0's semantic colour tokens through [tokens.js](../../../foundations/tokens/tokens.js).
