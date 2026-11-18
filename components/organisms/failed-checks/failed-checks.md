# FailedChecks

The checks failing now, as Dash0's Failed checks page lists them: one of the views people check most.

Storybook: `Components/Status/FailedChecks` · Stories: `components-status-failedchecks--*`

## When not to use it

- **One check in detail:** write its summary and rule with [Text](../../atoms/text/text.md), and link to it in Dash0.

## Quick start

```jsx
import { FailedChecks } from '../components/organisms/failed-checks/failed-checks.jsx'

<FailedChecks checks={checks} now={checkedAt} href={failedChecksUrl} />
```

## Variants

A title with a [Badge](../../atoms/badge/badge.md) counting each status, then a [Table](../../molecules/table/table.md): each check's status as a Badge, its summary, the services it names, and how long it has failed (`6m`, `3h 11m`, `9d 4h`). Critical checks come first, then the newest. An Open in Dash0 link under it, in the CTA purple.

The fixture is a sample answer in the shape of the Dash0 MCP's `getFailedChecks`.

<Canvas story="components-status-failedchecks--default" />

**All passing.** With nothing failing it says so and what comes next (EMPTY-006): "All checks passing. New failures show here."

<Canvas story="components-status-failedchecks--all-passing" />

## Do and don't

**Do** pass `now`, the time the checks were read, so the durations are right when the answer is old.

## Accessibility

- A status is a word in its Badge, not a colour alone.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `checks` | `[{ status, summary, rule, since, services }]` | required | `status` is `'critical'` or `'degraded'`, `since` an ISO time, `services` names |
| `now` | ISO time | required | When the checks were read, for how long each has failed |
| `href` | string | none | The Failed checks page in Dash0, for Open in Dash0 |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Badges over a Table | The same | The same; long summaries cut with an ellipsis |

## Source of truth

- Dash0's Failed checks page and the MCP's `getFailedChecks` fields. Badge colours from Dash0's web Badge through [tokens.js](../../foundations/tokens/tokens.js).
