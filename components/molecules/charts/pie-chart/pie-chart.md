# PieChart

The parts of a whole, such as spans by status or requests by service, as a round pie, a slice a share.

Storybook: `Components/Charts/PieChart` · Stories: `components-charts-piechart--*`

## When not to use it

- **The exact share matters, or two shares are close:** use [SquareChart](../square-chart/square-chart.md), the same data as a waffle. Squares compare better than angles.
- **Comparing values that aren't parts of one whole:** use [BarChart](../bar-chart/bar-chart.md).
- **The parts over time:** use a stacked [BarChart](../bar-chart/bar-chart.md) or [Timeseries](../timeseries/timeseries.md).

## Quick start

```jsx
import { PieChart } from '../components/molecules/charts/pie-chart/pie-chart.jsx'

<PieChart slices={[{ label: 'OK', value: 588000 }, { label: 'ERROR', value: 30800 }]} unit="spans" />
```

## Variants

The slices go clockwise from 12 o'clock, largest first, each in its colour. A terminal cell is twice as tall as it is wide, so the disc is twice as many cells wide as it is lines tall, and round on screen. Each cell is read at its four quarters and drawn as the quadrant glyph (`▗▄▖▐▌▝▀▘`, `█` and the rest) of the quarters inside the disc, in the colour of the slice most of them are in, so the edge reads round. A cell holding two slices hovers as the one it is drawn in.

The pie fills the width of its Box: its radius is as large as fits beside the legend, 4 to 6 lines (16 to 24 cells wide); 6 where the width isn't known, on mobile. A legend beside the disc names each slice with its value and its exact share. It moves under the disc when the two don't fit side by side.

Hovering a slice lights its cells and its legend line, and shows its card over the legend: name, value and share. Each chart's slices have their own hover groups, so hovering one chart lights nothing in another.

Slices without a colour take the [Color Manager](../../../foundations/color-manager/color-manager.md)'s colour for their label, so `api` matches its line and its bars. Span statuses take their status colours. The legend, the cards, Other and the colours are [SquareChart](../square-chart/square-chart.md)'s.

<Canvas story="components-charts-piechart--default" />

**A slice too small for a cell.** Too thin to win a cell, it gets none but keeps its line in the legend, with its share.

<Canvas story="components-charts-piechart--span-status" />

**Few slices.**

<Canvas story="components-charts-piechart--few" />

**Other.** Past `maxSlices` (9: the auto palette repeats after that), the smallest fold into one Other slice, in the unset series colour.

**No data.** An empty disc, dim, and `no data`.

<Canvas story="components-charts-piechart--no-data" />

## Do and don't

**Do** use it for a few parts of one total, for a quick read of which is biggest: statuses, regions, the top services.

**Don't** use it to compare shares that are close, or to read one exactly: use [SquareChart](../square-chart/square-chart.md).

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
| Draws as | Round pie, sized to its Box, legend beside | The same | Round pie, radius 6, legend under |

## Source of truth

- Dash0's Pie panel: the same data, slices of one total, drawn round.
- The disc, for the terminal: each cell read at four dots, a dot's slice by its angle, two slices to a cell inside the disc and quarter-block glyphs at its edge.
