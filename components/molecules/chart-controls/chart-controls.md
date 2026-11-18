# ChartControls

The line of controls over a chart: how it draws, its time range, and zoom. [ChartCard](../../organisms/chart-card/chart-card.md) draws it under its title; use it alone over a chart that has no card.

Storybook: `Components/Charts/ChartControls` · Stories: `components-charts-chartcontrols--*`

## When not to use it

- **Switching between different charts or views:** use [Tabs](../tabs/tabs.md).
- **A chart in a card:** pass the same props to [ChartCard](../../organisms/chart-card/chart-card.md), which draws these controls itself.

## Quick start

```jsx
import { ChartControls } from '../components/molecules/chart-controls/chart-controls.jsx'

<ChartControls lineType={lineType} onLineTypeChange={setLineType} range={range} onRangeChange={setRange} />
```

## Variants

Each control shows only when it is given its value. The controls change nothing themselves: the page keeps every value, passes it on to the chart, and draws again.

**Line chart.** `lineType` gives a Dots / Lines / Bars toggle, each with an icon drawn in its style: `⣀⡠⠊ Dots`, `╭─╯ Lines`, `▁▃▅ Bars`. `addZoomControl` adds `o: −` and `i: +` at the far right.

<Canvas story="components-charts-chartcontrols--default" />

**Zoomed.** While `zoom` is set, the span shown takes the ranges' place as the one selected, with a Reset zoom button beside it.

**Keys.** While the pane has the keyboard, `o` zooms out, `i` zooms in and `r` resets the zoom. They are the only keys besides a page's main CTA: zoom is what you press over and over. Two charts on one key: the later drawn wins, so `hotkeys={false}` gives them to another chart. A Timeseries gives them to the chart last used.

<Canvas story="components-charts-chartcontrols--zoomed" />

**Bar chart.** `orientation` gives a Vertical / Horizontal toggle: `▂▅▇ Vertical`, `≡ Horizontal`. Leave zoom out: a bar chart's bars are its labels, with nothing between them to zoom into.

<Canvas story="components-charts-chartcontrols--bar-chart" />

**Custom ranges.** `ranges` takes any list, such as an SLO's windows. `[]` draws none.

<Canvas story="components-charts-chartcontrols--custom-ranges" />

## Do and don't

**Do** pass the same `lineType` or `orientation` to the chart. The controls only show the choice.

**Don't** give a bar chart zoom controls. There is no span between two bars to zoom into.


## Accessibility

- Every toggle's label names it in words; the icon before it is decoration.
- The selected option is marked by a bright accent border, the others dim, so it doesn't rest on colour alone.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `lineType` | `'braille' \| 'box' \| 'bars'` | none | With it, a Dots / Lines / Bars toggle |
| `onLineTypeChange` | `(value) => void` | none | Runs with the line type pressed |
| `orientation` | `'vertical' \| 'horizontal'` | none | With it, a Vertical / Horizontal toggle |
| `onOrientationChange` | `(value) => void` | none | Runs with the orientation pressed |
| `ranges` | `{ value, label }[]` | 1h, 6h, 24h | The time ranges offered. `[]` for none |
| `range` | string | none | The selected range's value |
| `onRangeChange` | `(value) => void` | none | Runs with a range's value when it is pressed |
| `zoom` | string | none | While zoomed, the span shown, in the ranges' place |
| `onZoomReset` | `() => void` | none | Runs when Reset zoom is pressed |
| `hotkeys` | boolean | `true` | `o`, `i` and `r` press zoom out, zoom in and Reset zoom |
| `addZoomControl` | boolean | `false` | `o: −` and `i: +` at the far right. Line charts only |
| `onZoomIn` | `() => void` | none | Runs on + or `i` |
| `onZoomOut` | `() => void` | none | Runs on − or `o` |

Each toggle's button has the key `tab-<value>`, which tests press.

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Toggles | Bordered buttons, the selected one's border in the accent colour | The same | The same |
| Zoom | `−`, `+` | The same | The same |

## Source of truth

- Built from [Button](../../atoms/button/button.md), `bordered` and `selected`. Not yet checked against a Dash0 Storybook component; when Dash0 has a chart toolbar, take its name and props and say so here.
- Icons: drawn in the glyphs each option draws with, braille dots and box-drawing lines, since a terminal has no Lucide.
