# Color Manager

Where every chart gets its series colours. A series keeps its colour by name, in every chart, and a series whose attributes mean something takes that meaning's colour: an `ERROR` span status, a 5xx, an `error.type` is the error red.

Storybook: `Foundations/Colors/Color Manager` · Stories: `foundations-colors-color-manager--*`

## When not to use it

- **A state that isn't a series** (a badge, a banner): use `status()` from [Colors](../tokens/tokens.md).

## Quick start

```js
import { getColor } from '../../foundations/color-manager/color-manager.js'

getColor('auto', 'order-history-api')                                  // the next free palette colour, then always that one
getColor('auto', 'ERROR', { otel_span_status_code: 'ERROR' })          // the error red
```

[Timeseries](../../molecules/charts/timeseries/timeseries.md) calls it for you. Pass a series' labels as `attributes` and the meaning comes along.

## Variants

**Default.** What each palette hands out to `series-0` through `series-39`: the nine auto colours in Dash0's order, then the same nine brightened and darkened.

<Canvas story="foundations-colors-color-manager--default" />

**Meaning.** The colour each attribute set takes:

<Canvas story="foundations-colors-color-manager--meaning" />

| Meaning | Attributes | Colour |
| --- | --- | --- |
| critical | span status `ERROR`, HTTP 5xx or 0, log `ERROR`/`FATAL`, `error.type`, `exception.type` | `status('error')` |
| attention | HTTP 4xx, log `WARN`, `otel.metric.overflow=true` | `status('warning')` |
| info | HTTP 1xx/3xx, log `INFO` | `status('info')` |
| default | span status `OK`, HTTP 2xx, log `DEBUG`/`TRACE` | `status('debug')`; split by HTTP status alone, each 2xx a seagull shade |
| unknown | span status `UNSET`, log `UNKNOWN` | `status('unknown')` |

Both the OTel key (`otel.span.status.code`) and the Prometheus one (`otel_span_status_code`) count. When a series has several, the worst wins.

## Do and don't

**Do** pass the labels a query returned. Without them an `ERROR` series is just the next palette colour.

**Don't** pick a series colour by its index. A filter that drops one series would repaint the rest.

## Accessibility

- Meaning is never colour alone: the series' name and its labels are in the chart's hover card.

## Props

| Function | Returns |
| --- | --- |
| `getColor(palette, name, attributes?)` | A hex for the theme. `palette`: `'auto'`, `'categorical'`, `'schemeTableau10'`, `'schemeCategory10'`, `'schemeDark2'`, with or without `dash0.` |
| `colorCoding(attributes)` | `'critical'`, `'attention'`, `'info'`, `'default'`, `'unknown'` or `undefined` |
| `resetColors()` | Forgets every assignment |

Only the auto palette reads meaning, as in Dash0. A series named `''` or `{{unset}}` takes the unset grey.

## Surfaces

The same on every surface. A series keeps its slot across a theme switch and takes that slot's colour in the new theme.

## Source of truth

In Dash0's web design system:

| What | Where |
| --- | --- |
| Assignment, order, brightening | The color manager and its palettes manager |
| Meaning from attributes | The semantic colour coding, which lists the keys |
| Auto palette applies meaning | The named colour scale |
| d3 palettes | The named d3 palettes |

Left out:
- Dash0 keeps assignments in localStorage for two days. Here they last while the mod is loaded.
- gRPC and Connect status codes mean something only for a known span kind. A metric series has no span kind, so they draw as palette colours, as in Dash0's charts.
- Brightened colours are clipped to sRGB, where a browser may map them into the gamut more gently.
- Dash0's story has buttons to add or remove 10 series. This one draws a fixed 40.
