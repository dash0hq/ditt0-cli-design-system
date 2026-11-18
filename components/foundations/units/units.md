# Units

How a chart writes a number with its unit, as Dash0 does: `850 μs`, `1.2 GB`, `12.5K/s`, `42.1%`.

Storybook: `Foundations/Units` · Stories: `foundations-units--*`

Every chart takes a `unit` and formats with [units.js](./units.js). Pass the raw value in the base unit (bytes, seconds) and the chart picks the scale. Use units.js directly when a page writes a value outside a chart.

## Quick start

```js
import { formatValue, scaleFor } from '../components/foundations/units/units.js'

formatValue(0.00085, 'seconds')          // '850 μs'
formatValue(3.2e9, 'bytes')              // '3.2 GB'
formatValue(4.5e6, 'bytes/s')            // '4.5 MB/s'
formatValue(12500, '/s')                 // '12.5K/s'

// One scale for a column, from its largest value (UNIT-002)
const scale = scaleFor('ms', 698.51)
formatValue(0.84, 'ms', scale)           // '0.84 ms', not '840 μs'
```

<Canvas story="foundations-units--default" />

## Units

| Unit | Also | Pass | Writes |
| --- | --- | --- | --- |
| `'bytes'` | `'B'`, `'By'` | bytes | `B`, `kB`, `MB`, `GB`, `TB`, `PB`, steps of 1000 |
| `'bytes/s'` | `'B/s'`, `'By/s'` | bytes per second | `B/s`, `kB/s`, `MB/s`, `GB/s`, `TB/s`, `PB/s`, steps of 1000 |
| `'seconds'` | `'s'` | seconds | `ns`, `μs`, `ms`, `s`, `min`, `h`, `d` |
| `'milliseconds'` | `'ms'` | milliseconds | as seconds |
| `'percent'` | `'%'` | 0 to 100 | `42.1%` |
| `'ratio'` | | 0 to 1 | `50%` |
| `'decimal'` | | a count | `1128`, `12.5K`, `2.5M`, `1.2B`; K from 10,000 |
| anything else | | a count | the number as `decimal` writes it, then the text: `12.5K/s`, `3 spans` |

Numbers have 3 significant digits and at most 2 decimals, with no trailing zeros. A space goes between a number and an abbreviation (UNIT-001). There is no space before `%`, a count's `K`, or a unit that starts with `/`.

## Scales

A chart picks one scale per axis from its largest value, so the axis and the cards share a unit (UNIT-002). The axis writes numbers alone, with the unit once above it.

- **Time, bytes and percent** keep one scale across a chart's small multiples too, so a card reads `0.84 ms` beside `699 ms`.
- **Counts** scale per panel. 600 errors beside 2.5 million spans would otherwise read `0.0006M`.

## API

| Export | What it does |
| --- | --- |
| `formatValue(value, unit, scale?)` | The value with its unit. In its own scale, or in `scale`. `null` is `no data` |
| `scaleFor(unit, max)` | `{ divide, suffix }`: the scale for values up to `max` |
| `formatNumber(value, scale)` | The number alone in a scale, for an axis |
| `unitLabel(unit, max)` | The unit as a scale writes it, for above an axis: `GB`, `ms`, `K/s` |
| `sharesScale(unit)` | Whether values in this unit share a scale wherever they sit together |
| `UNITS` | The unit names that scale |

## Source of truth

- The steps of each unit (`TIME`, `BYTES`, `COUNT`), the short names (`ALIASES`) and the units that share a scale (`SHARED_SCALE`) are exported from [units.js](units.js) and generated into the [Go package](../../../go/README.md)'s `constants_gen.go`, so Go writes numbers as this does.
- UNIT-001 and UNIT-002 in Dash0's content guidelines.
- The unit names are the ones Dash0's panels use for their unit setting: decimal, bytes, seconds, percent.
