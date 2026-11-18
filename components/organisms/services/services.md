# Services

The services and how they are doing, as Dash0's Services catalog lists them: health, request rate, errors and p95 latency (RED).

Storybook: `Components/Status/Services` · Stories: `components-status-services--*`

## When not to use it

- **One service over time:** use [Timeseries](../../molecules/charts/timeseries/timeseries.md) or [Stat](../../molecules/charts/stat/stat.md).

## Quick start

```jsx
import { Services } from '../components/organisms/services/services.jsx'

<Services services={catalog} href={catalogUrl} />
```

## Variants

A [Table](../../molecules/table/table.md), busiest first: a health [Badge](../../atoms/badge/badge.md), the service, requests per second, the error percentage and p95 latency. Rates scale per value (`9627/s`, `3.23/s`). Latency shares the unit most rows are in (UNIT-002), so one slow outlier reads `306153 ms`, not `5.1 min` among milliseconds. Error rates under 0.01% read `<0.01%`, not `0%`. An Open in Dash0 link under it.

The fixture is a sample answer in the shape of the Dash0 MCP's `getServiceCatalog`.

<Canvas story="components-status-services--default" />

**Health from errors.** A service without Dash0's `health` takes one from its error rate: from `errorThresholds.degraded` percent it is degraded, from `critical` critical (defaults 1 and 5).

<Canvas story="components-status-services--from-error-rate" />

## Do and don't

**Do** pass Dash0's own health when you have it. It counts failed checks, which an error rate doesn't.

## Accessibility

- Health is a word in its Badge, not a colour alone.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `services` | `[{ name, requests, errors, p95, health }]` | required | `requests` total over the window, `errors` a percentage, `p95` seconds, `health` Dash0's |
| `window` | number | `3600` | Seconds the requests were counted over, for the rate |
| `errorThresholds` | `{ degraded, critical }` | `{ degraded: 1, critical: 5 }` | Percents, for services without `health` |
| `title` | string | `'Services'` | The line over the table |
| `href` | string | none | The catalog in Dash0, for Open in Dash0 |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Table | The same | The same |

## Source of truth

- Dash0's Services catalog and the MCP's `getServiceCatalog` fields (`requests_total`, `errors_percentage`, `duration_p95_seconds`, Health).
