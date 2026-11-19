# Timeseries

Lines or bars over time: latency percentiles, request rates, memory, any PromQL range query.

Storybook: `Components/Charts/Timeseries` · Stories: `components-charts-timeseries--*`

## When not to use it

- **Comparing totals, or a few series at a few points:** use [BarChart](../bar-chart/bar-chart.md), grouped or stacked.

## Quick start

```jsx
import { Timeseries } from '../components/molecules/charts/timeseries/timeseries.js'

<Timeseries series={[{ name: 'p99', values: [372, 357, 338] }]} times={['03:35', '03:40', '03:45']} unit="ms" />
```

## Variants

**Shared axis.** Up to three series draw on one axis, each in its own colour from the [Color Manager](../../../foundations/color-manager/color-manager.md). A [Legend](../../../atoms/legend/legend.md) under the plot says which colour is which; `legend={false}` leaves it out, and so does a chart whose series have no names. The y axis runs between round numbers, as Dash0's does (d3's `nice()`): an axis for values up to 510 GB reads 0, 300, 600.

<Canvas story="components-charts-timeseries--default" />

**Small multiples.** Four or more series draw as one short panel each, so lines don't hide each other. Each panel has its own y axis, so each is headed by its series' name and unit (`p99 · ms`), in place of a legend (cut in the middle when it is wider than the chart), with a blank row between panels: one panel's labels never read as the next one's axis. So do fewer, when one of them would draw as a flat row on the others' axis: 600 errors beside 2.5 million spans.

<Canvas story="components-charts-timeseries--small-multiples" />

`multiples={false}` keeps every series on one axis instead, with a legend: quantiles (p99 down to p50 and the mean) read best together, as Tracing's Duration chart draws them.

**Span status.** Series with meaning in their labels take its colour: `ERROR` is the error red, `OK` the debug blue, `UNSET` grey.

<Canvas story="components-charts-timeseries--span-status" />

**Gaps.** A `null` value is a gap in the line, never a zero. The hover card says "no data" there.

<Canvas story="components-charts-timeseries--gaps" />

**Line types.** `lineType` picks how the line is drawn. [ChartCard](../../../organisms/chart-card/chart-card.md) can offer it as a Dots / Lines / Bars switch, so the person reading the chart picks.

- `'braille'`, shown as Dots: each cell is a 2 × 4 grid of braille dots, and it is always one thin line: a point per dot column, joined to the next. A dot column with several samples takes their mean, so many samples never pile up into a thick smear. With fewer samples than dot columns, each sample is a point at its exact value and the line slopes between them.
- `'box'`, the default, shown as Lines: box-drawing glyphs (`╭─╮`), a row at a time. A column with several samples sits at their mean, so it reads as one line too, a quarter as fine as braille.
- `'bars'`, shown as Bars: a bar a column from zero, its top in eighths of a row (`▁▂▃▄▅▆▇█`). This is Dash0's bar display for a time series, used on about one panel in five. Bars stand on the axis: 0 is written on the axis line, and the two gridlines read 3k and k for a round k, where a bar of exactly that value ends. A time is one bar, never several of the same hour: with more samples than fit, they cluster into windows that keep to the clock (1, 2, 3, 4, 6 samples or a multiple of 12, so 5-minute samples make 5, 10, 15, 20, 30 minutes or whole hours), each bar at least two columns wide with an empty one after it. Every bar is as wide as the others, and its tick sits under its middle. Hovering a bar lights it whole; hovering a group lights every bar in it.

<Canvas story="components-charts-timeseries--dots" />

<Canvas story="components-charts-timeseries--crossing" />

<Canvas story="components-charts-timeseries--box-lines" />

<Canvas story="components-charts-timeseries--bars" />

**Several series as bars.** Grouped: the samples folded into as many time windows as groups fit the width, each window a group of a bar per series, side by side, with two empty columns before the next group. One shared axis, so each series is read against the others at that moment. The chart draws them itself, so drag, i, o and r still zoom, and hovering a bar shows the window's card with every series' value.

<Canvas story="components-charts-timeseries--bars-grouped" />

`stacked` puts them one on another instead, one bar a time, for series that add up to a total that means something.

<Canvas story="components-charts-timeseries--bars-stacked" />

**Crossing lines.** A cell holds one character, so where two lines meet in a cell, one of them shows. The series listed first is drawn over the others: its line stays whole and in its colour, and a line passing under it breaks there, as a line passing behind. Put the series that matters most first, such as the one an alert is about. Box lines can merge instead, `overlap="merge"`: both strokes as one glyph (`┼`, `├`, ...), in neither colour. Every stroke shows, but in a tangle you can't tell whose it is.

<Canvas story="components-charts-timeseries--box-merged" />

Lines of very different sizes never cross on one axis: the chart draws them as small multiples, a panel each, before they could.

## Size

The chart fills the width of the Box it sits in, less two empty cells on the right, so its line never touches the edge. Size it with its container: a card, a column, a pane. There is no width prop.

- **More samples than columns:** samples fold into columns (braille: into dot columns, two a cell), and the line runs through their means. Dash0 draws every point; a terminal has too few cells, so a column is its samples' mean, with their high and low in its card. A spike shorter than a column is averaged down on the line, but never lost: where a column's samples reach more than a row past its mean, the column's hover card marks their high and low `▲` and `▼` after its mean, and the mean `◆` (`◆5.1/s ▲10.2`). Nothing is drawn for it on the chart, so the line stays clean. The y axis spans every sample's low and high. Zoom in to see a spike as the line itself.
- **Fewer samples than columns:** every sample gets a place of its own, at its exact value, and the line runs straight from one sample to the next across the columns between. Next to a gap the line ends at the sample, never held flat into the gap. A spike or a dip is never shaved off, and the y axis is the same at every width. A column's hover card shows the sample nearest it, never an in-between value, and a gap stays a gap.

How: the chart draws a measure region ([measure.js](../../../measure.js)), a `Client` as wide as the Box that draws nothing and reports its width. The first draw, before it reports, is a column per sample, 60 at most. On mobile, which has no `Client`, it stays that way.

## Zoom

Give the chart `onZoom`, and it zooms as a map does. Drag across the plot: the time axis under the columns covered lights up, and letting go runs `onZoom({ start, end, from, to })` with the first and last sample covered, by index and by time. The chart changes nothing itself. The page queries that span and draws the chart again, as with [ChartCard](../../../organisms/chart-card/chart-card.md)'s ranges, which also offers − and + buttons and Reset zoom. The ChartCard Default story zooms.

To zoom with keys around the moment under the pointer, give it `onHover` too: as the pointer moves over the plot it runs with the samples there (the same shape as `onZoom`'s), and with `null` when the pointer leaves. It draws nothing again, so keep the value outside what redraws the page. Pressing `i` or `o` (or `+` and `−`) after clicking the chart runs `onZoomIn` or `onZoomOut`; ChartCard's `i` and `o` hotkeys work while the pane has the focus. The page halves or doubles the span, keeping the hovered sample where it is on screen.

How: Claude Code draws hover itself and tells a hooks module nothing about it, so a chart with `onZoom` is drawn by its own `Client`, [timeseries.client.js](timeseries.client.js), which sees the pointer. It lights the hovered column and draws its card itself, the same as the chart without zoom.

- A click without a drag zooms nothing.
- No zoom on mobile, which has no `Client`: there the chart draws as without `onZoom`.

## Units

`unit` scales to the values' size ([Units](../../../foundations/units/units.md)): pass memory in bytes with `unit="bytes"` and it reads `25.2 GB`; seconds with `unit="seconds"` and a value under one reads `372 ms`. One scale per chart, from its largest value, so the axis and the cards agree (UNIT-002). The axis writes numbers, with the unit once above it; small multiples write it beside each panel's name. Every value in a hover card carries it. The time axis never has a unit.

<Canvas story="components-charts-timeseries--bytes" />

<Canvas story="components-charts-timeseries--seconds" />

- Set `unit` whenever the values are not plain counts. Without it, `200` could be ms, MB or req/s.
- Pass values in the base unit and let the chart scale: `'bytes'`, `'seconds'` (or `'ms'` for milliseconds), `'percent'`, `'ratio'`, `'decimal'`.
- Any other `unit` is written after the number as it stands, and counts scale to K and M from 10,000: `12.5K/s`.
- All series share one unit. Series in different units go in separate charts: there is never a second y axis.
- OpenTelemetry metric units: `By` is bytes and scales as `'bytes'`; `1` is a plain count, leave `unit` out; drop the braces from `{requests}/s`, write `/s`.

**Time axis.** Labels at the start, middle and end, with a blank cell at least between two: a label that would touch the one before it is left out. The chart writes `times` as given. `timeLabel="UTC"` says what zone they are in, dim at the end of the time axis.

The same rules hold for [BarChart](../bar-chart/bar-chart.md)'s `unit`.

## Do and don't

**Do** pass `null` where a series has no sample. A zero claims a measurement that never happened.

**Do** pass each series' labels as `attributes`. That is where its meaning comes from.

**Don't** pass dozens of series. Past nine, colours are brightened variants that get hard to tell apart. Filter or aggregate the query first.

## Accessibility

- Hovering a column shows a card with the time and every series' value, so a value never depends on reading the line's colour. The card always sits inside the chart, beside the column where there is room, and is at most half the chart wide (24 cells on a narrow one), so the chart stays in view: a name too long for it is shortened with `…` in the middle, the value keeps its width.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `series` | `{ name, values: (number \| null)[], attributes? }[]` | required | Every series, all the same length. `attributes`: its labels, `{ key: value }` |
| `times` | string[] | the sample's index | A label per value |
| `unit` | string | `''` | Scales with the values (`'bytes'`, `'seconds'`, `'ms'`, `'percent'`, `'ratio'`, `'decimal'`), or any text written after the number. Written once above the y axis and after every card value |
| `lineType` | `'braille' \| 'box' \| 'bars'` | `'box'` | Dots: one thin braille line through each dot column's mean. Lines: box-drawing glyphs, a row at a time. Bars: a bar a column, in eighths of a row |
| `stacked` | boolean | `false` | For bars of several series: one on another, one bar a time. Without it they are grouped, side by side |
| `legend` | boolean | `true` | A legend under a shared panel. Small multiples name each panel instead |
| `timeLabel` | string | none | What zone `times` are in, such as `'UTC'`, dim at the end of the time axis |
| `overlap` | `'first' \| 'merge'` | `'first'` | Box lines where they cross: the first series over the others, or both strokes as one uncoloured glyph. Braille always draws the first over the others |
| `onZoom` | `({ start, end, from, to }) => void` | none | With it, dragging across the plot zooms; runs with the span dragged, by sample index and time |
| `onHover` | `({ start, end, from, to } \| null) => void` | none | With `onZoom`: the samples under the pointer as it moves, `null` when it leaves. Draws nothing again |
| `onZoomIn` | `() => void` | none | With `onZoom`: `i` or `+` pressed while the chart has the focus |
| `onZoomOut` | `() => void` | none | With `onZoom`: `o` or `−` pressed while the chart has the focus |
| `palette` | string | `'auto'` | A Dash0 named palette: `'auto'`, `'categorical'`, `'schemeCategory10'`, `'schemeDark2'` |

## Surfaces

The same box-drawing chart on every surface, filling its Box's width on the terminal and desktop, a column per sample on mobile. Hover cards need a pointer: desktop, or a terminal with mouse support.

## Source of truth

- Rows, the line glyphs and the round steps of the y axis are in [timeseries.constants.js](timeseries.constants.js), which the [Go package](../../../../go/README.md) reads too (generated into `constants_gen.go`). Change them there.
- Colours: Dash0's color manager, through [color-manager.js](../../../foundations/color-manager/color-manager.js). A series keeps its colour by name across charts, and takes the colour of what its attributes mean.
- Known gap: on a dark terminal the second dark colour (`#225584`) has low contrast. Dash0's charts draw on a lighter card than most terminals.
