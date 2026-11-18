# ChartCard

A chart in a card: a title, where the data comes from, a line of controls (time ranges, zoom), the chart, and actions such as Open in Dash0.

Storybook: `Components/Charts/ChartCard` · Stories: `components-charts-chartcard--*`

## When not to use it

- **A chart inside something that already has a frame and title,** such as a tool result: use the chart alone, [BarChart](../../molecules/charts/bar-chart/bar-chart.md) or [Timeseries](../../molecules/charts/timeseries/timeseries.md).
- **Switching between different charts:** use [Tabs](../../molecules/tabs/tabs.md) above them. The card's buttons change the time range, not what is shown.

## Quick start

```jsx
import { ChartCard } from '../components/organisms/chart-card/chart-card.jsx'

<ChartCard title="Requests per second" subtitle="sum by (service_name) (rate(dash0_spans_total[5m]))" range={range} onRangeChange={setRange}>
    <Timeseries series={series} times={times} unit="/s" />
</ChartCard>
```

## Variants

**Time series.** The default: a line chart under a title and the query it came from, with 1h, 6h and 24h on a line of their own under them. The chart fills the card's width. In the gallery, pressing a range shows that span of the fixture, as a page querying again would.

<Canvas story="components-charts-chartcard--default" />

**Zoom.** Pass the Timeseries an `onZoom`, and dragging across its plot zooms in: the page keeps the span and gives the card `zoom`, the span as text (`05:00–06:00`), and `onZoomReset`. While zoomed, the span takes the ranges' place as the one selected range, with a Reset zoom button beside it; reset, the ranges come back. `addZoomControl` adds − and + at the far right of the controls, one row high, for zooming without a drag: `onZoomOut` and `onZoomIn` run, and the page decides how far each goes. Zoom as a map does: pass the Timeseries `onHover`, keep the sample under the pointer, and halve or double the span around it, so that sample stays where it is on screen; pass the same `onZoomIn` and `onZoomOut` to the Timeseries, for `i` and `o` pressed after a click on the chart. The Default story does this, zooms around the middle when the pointer is off the chart, and drops the zoom when − reaches the whole range or another range is pressed.

**Line type.** Give the card `lineType` and `onLineTypeChange`, and it offers a `⣀⡠⠊ Dots` / `╭─╯ Lines` / `▁▃▅ Bars` toggle beside the ranges, for the person reading the chart to pick braille dots or box-drawing lines. Pass `lineType` on to the [Timeseries](../../molecules/charts/timeseries/timeseries.md) inside. The Default story has it. The controls are [ChartControls](../../molecules/chart-controls/chart-controls.md); the card passes its props on.

**Bar chart.** Any chart goes in the card. Here, p99 latency by hour, with `orientation` and `onOrientationChange`: a `▂▅▇ Vertical` / `≡ Horizontal` toggle in place of Dots / Lines. Pass `orientation` on to the [BarChart](../../molecules/charts/bar-chart/bar-chart.md) inside, and leave zoom out.

<Canvas story="components-charts-chartcard--bar-chart-card" />

**No ranges.** `ranges={[]}` draws no buttons: for a span that can't change, such as a past incident.

<Canvas story="components-charts-chartcard--no-ranges" />

## Ranges

The card shows the ranges and reports the one pressed, through `onRangeChange(value)`. It changes nothing by itself: the page keeps `range`, queries again for the new span, and draws the card with the new data. That is how [Tabs](../../molecules/tabs/tabs.md) leaves the open tab to its caller. [ChartControls](../../molecules/chart-controls/chart-controls.md) draws the controls: the ranges, line type and Reset zoom as outlined buttons (secondary), the selected one's border in the accent colour, the others dim; − and + as tertiary buttons, their label alone, to stay small.

- Pass your own `ranges` when the defaults don't fit, such as `[{ value: '15m', label: '15m' }, ...]`.
- Each range's button has the key `tab-<value>`, which tests press.

## Do and don't

**Do** say where the data comes from in `subtitle`: the query, the service, or the span. A chart without its source can't be checked.

**Do** set `unit` on the chart inside. The card's title names the measure; the chart carries the unit.

**Don't** put two charts in one card. Use a card each, so each has its own title and range.

**Don't** size the chart. It fills the card, and the card fills what it sits in.

## Accessibility

- The title and subtitle are text, read out on desktop and mobile with the chart's own `alt`.
- The selected range is marked by brightness, not colour, and each range's label says its span.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | string | required | What the chart shows |
| `subtitle` | string | none | Where the data comes from: the query, service or span. Wraps onto a second line in a narrow pane |
| `ranges` | `{ value, label, hotkey? }[]` | 1h, 6h, 24h | The time ranges offered. `[]` for none |
| `range` | string | none | The selected range's value |
| `onRangeChange` | `(value) => void` | none | Runs with a range's value when it is pressed |
| `lineType` | `'braille' \| 'box' \| 'bars'` | none | With it, a Dots / Lines / Bars switch; pass the same to the Timeseries inside |
| `onLineTypeChange` | `(value) => void` | none | Runs with `'braille'`, `'box'` or `'bars'` when the switch is pressed |
| `orientation` | `'vertical' \| 'horizontal'` | none | For a bar chart, a Vertical / Horizontal switch; pass the same to the BarChart inside |
| `onOrientationChange` | `(value) => void` | none | Runs with `'vertical'` or `'horizontal'` when the switch is pressed |
| `zoom` | string | none | While zoomed in, the span shown, such as `'05:00–06:00'`: drawn as the selected range in the ranges' place, with a Reset zoom button |
| `onZoomReset` | `() => void` | none | Runs when Reset zoom is pressed |
| `addZoomControl` | boolean | `false` | Adds − and + at the far right, hotkeys `o` and `i`, for zooming without a drag |
| `onZoomIn` | `() => void` | none | Runs when + is pressed |
| `onZoomOut` | `() => void` | none | Runs when − is pressed |
| `actions` | elements | `[]` | Under the chart, in a row, such as a [Link](../../atoms/link/link.md) to Dash0 |
| `children` | an element | none | The chart |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Card | A dim rounded border, one cell of padding at the sides | The same | The same |
| Ranges, line type, zoom | A line under the title: outlined buttons, the selected range and line type in the accent colour; `o: −` and `i: +` at the far right, wrapping under them when the card is narrow | The same | The same, with no hotkeys |
| Chart | Fills the card's inside width | Fills the card's inside width | As its chart draws on mobile |

## Source of truth

- Built from [Text](../../atoms/text/text.md), [ChartControls](../../molecules/chart-controls/chart-controls.md) and a chart. It sits in Organisms because it uses molecules: the charts and ChartControls.
- Not yet checked against a Dash0 Storybook component. When Dash0 has a chart card or time-range picker, take its name, props and default ranges, and say so here.
