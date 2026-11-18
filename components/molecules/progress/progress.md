# Progress

How far along something is, or how full: a bar of a value out of a max, then the share as a percent.

Storybook: `Components/Feedback/Progress` · Stories: `components-feedback-progress--*`

## When not to use it

- **A value over time:** use [Timeseries](../../molecules/charts/timeseries/timeseries.md).
- **Comparing several values against each other:** use [BarChart](../../molecules/charts/bar-chart/bar-chart.md).

## Quick start

```jsx
import { Progress } from '../components/molecules/progress/progress.jsx'

<Progress label="Ingestion quota" value={62} />
```

## Variants

The filled part is drawn in half cells (`━` and `╸`) in the status colour, and the rest is a dim `━` track. The default colour is Dash0's CTA purple.

<Canvas story="components-feedback-progress--default" />

**Status colour.** Pick the status the value means, such as `error` for a disk nearly full.

<Canvas story="components-feedback-progress--critical" />

<Canvas story="components-feedback-progress--healthy" />

**Half a cell.** 1 of 40 over 20 cells is half a cell: `╸`.

<Canvas story="components-feedback-progress--half" />

**Without the percent.** `showValue={false}`.

<Canvas story="components-feedback-progress--no-value" />

**Nodes.** One under another, each coloured by how full it is.

<Canvas story="components-feedback-progress--nodes" />

## Do and don't

**Do** colour by meaning: healthy under 75%, warning from 75%, error from 90%, or the thresholds the view already uses.

**Don't** rely on the colour alone. The percent says the same thing in words.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | number | required | How far along, in the same unit as `max` |
| `max` | number | `100` | The value of a full bar |
| `label` | string | none | What it measures, dim, before the bar |
| `color` | status name | `cta` | `healthy`, `warning`, `error`, `info`, `debug`, `unknown` or `cta` |
| `width` | number | `20` | The bar's length in cells |
| `showValue` | boolean | `true` | The percent after the bar |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | `label ━━━━━━╸━━━━  62%` | The same | The same |

## Source of truth

- Dash0's web Progress. Colours from Dash0's semantic colour tokens through [tokens.js](../../foundations/tokens/tokens.js) `status(name).inline`.
