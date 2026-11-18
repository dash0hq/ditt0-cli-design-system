# SquareChart

The parts of a whole, such as spans by status or requests by service, as a waffle: a 10 × 10 square of small squares, each 1%.

Storybook: `Components/Charts/SquareChart` · Stories: `components-charts-squarechart--*`

## When not to use it

- **A quick read of the shares, where the exact share matters less:** use [PieChart](../pie-chart/pie-chart.md), the same data as a round pie.
- **Comparing values that aren't parts of one whole:** use [BarChart](../bar-chart/bar-chart.md).
- **The parts over time:** use a stacked [BarChart](../bar-chart/bar-chart.md) or [Timeseries](../timeseries/timeseries.md).

## Quick start

```jsx
import { SquareChart } from '../components/molecules/charts/square-chart/square-chart.jsx'

<SquareChart slices={[{ label: 'OK', value: 588000 }, { label: 'ERROR', value: 30800 }]} unit="spans" />
```

## Variants

Squares compare better than angles, so read shares here when the exact share matters; [PieChart](../pie-chart/pie-chart.md) draws the same slices round. The square fills slice by slice from the top left, largest first, each in its colour. A terminal cell is twice as tall as it is wide, so each cell holds two squares, top and bottom: `█` where both are one slice's, `▀` the top one's colour on the bottom one's. The whole square is 10 cells by 5 lines, and the squares touch, so each slice reads as one area of the whole. A cell holding two slices hovers as its top one. Shares round to whole squares by largest remainder, so there are always exactly 100. A legend beside the square names each slice with its value and its exact share. It moves under the square when the two don't fit side by side.

Hovering a slice lights its squares and its legend line, and shows its card over the legend: name, value and share. Each chart's slices have their own hover groups, so hovering one chart lights nothing in another.

Slices without a colour take the [Color Manager](../../../foundations/color-manager/color-manager.md)'s colour for their label, so `api` matches its line and its bars. Span statuses take their status colours.

<Canvas story="components-charts-squarechart--default" />

**A slice too small for a square.** Under 0.5% it gets no square but keeps its line in the legend, with its share.

<Canvas story="components-charts-squarechart--span-status" />

**Few slices.**

<Canvas story="components-charts-squarechart--few" />

**Other.** Past `maxSlices` (9: the auto palette repeats after that), the smallest fold into one Other slice, in the unset series colour.

**No data.** An empty square of dim `░` and `no data`.

<Canvas story="components-charts-squarechart--no-data" />

## Do and don't

**Do** use it for a few parts of one total: statuses, regions, the top services.

**Don't** use it for values that don't add up to a whole, such as latency by service.

## Accessibility

- Every slice has its name, value and share in the legend, so colour never carries it alone.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `slices` | `[{ label, value, color, attributes }]` | required | The parts. Without a colour, the Color Manager's for the label |
| `unit` | string | `''` | As units.js formats each value |
| `maxSlices` | number | `9` | The most slices drawn. The rest fold into Other |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Waffle, legend beside | The same | Waffle, legend under |

## Source of truth

- Dash0's Pie panel: the same data, slices of one total. The waffle layout is this library's, for the terminal; [PieChart](../pie-chart/pie-chart.md) is the round one.
