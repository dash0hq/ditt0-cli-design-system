# Icon

One glyph, one cell: every icon the components draw, by name, in one place.

Storybook: `Foundations/Icons` · Stories: `foundations-icons--*`

## When not to use it

- **A state on its own:** use [Badge](../badge/badge.md), or an icon beside words. An icon never says a thing alone.
- **A link out of Claude Code:** use [Link](../link/link.md) `variant="cta"`, which draws ↗ itself.
- **A chart's series swatch:** use [Legend](../legend/legend.md), which picks the swatch for a line or a bar.

## Quick start

```jsx
import { Icon, ICONS } from '../components/atoms/icon/icon.jsx'

<Icon name="check" color="healthy" />
```

## Variants

**Default.** A name and a status colour: the glyph in the status' inline colour.

<Canvas story="foundations-icons--default" />

**Status.** Any status from [tokens.js](../../foundations/tokens/tokens.js): `error`, `warning`, `info`, `healthy`, `debug`, `unknown`, `cta`.

<Canvas story="foundations-icons--status" />

**Subtle.** `color="subtle"`: dim, for an icon that guides rather than tells, such as a Collapsible's chevron.

<Canvas story="foundations-icons--subtle" />

**All.** Every icon beside its name.

<Canvas story="foundations-icons--all" />

| Name | Glyph | Drawn by |
| --- | --- | --- |
| `check` | ✓ | Banner (success), EmptyState (done), FailedChecks |
| `error` | ✖ | Banner, EmptyState |
| `warning` | ▲ | Banner |
| `info` | ℹ | Banner |
| `close` | ✕ | Tag's remove, Banner's dismiss |
| `external-link` | ↗ | Link (cta) |
| `plus`, `minus` | + − | ChartControls' zoom |
| `chevron-right`, `chevron-down` | ▸ ▾ | Collapsible |
| `breadcrumb` | › | Tracing's built-in views |
| `trend-up`, `trend-down` | ▲ ▼ | Stat's change, Timeseries' tooltip |
| `status-dot` | ● | List |
| `square` | ■ | PieChart, SquareChart, Gauge, Heatmap's legend |
| `marker` | ◆ | Timeseries' marked point |
| `diamond` | ◇ | EmptyState (first-time) |
| `empty` | ∅ | EmptyState (no-results) |
| `selected` | ▌ | List's selected row |
| `menu` | ≡ | ChartControls' horizontal bars |
| `line`, `dashed-line` | ━ ┄ | Legend's swatch, chart grid lines |

## Do and don't

**Do** put words beside an icon. `✓ Passing`, not `✓`.

**Don't** pick a glyph by look alone: use the name that means what you mean, so `warning` and `trend-up` can part later.

**Do** add a new icon to `ICONS` before drawing it in a component, so the set stays in one place.

## Accessibility

- Claude Code's Text has no accessible name of its own, so an icon is read out as its glyph, if at all. The words beside it carry the message.
- Colour repeats the icon's meaning, never replaces it.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `name` | a key of `ICONS` | `'check'` | The glyph; an unknown name draws nothing |
| `color` | a status, `'subtle'`, or any Text colour | none | Its colour; none is the theme's text |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | One glyph in the terminal's font | The same | The same |

## Source of truth

- Names: Lucide's, as Dash0's icons (`Foundations/Icons`) use, where Lucide has one.
- Colours: Dash0's semantic colour tokens, through [tokens.js](../../foundations/tokens/tokens.js) `status()`.
- Left out: Dash0's SVG icons and `size`. A terminal draws one cell of text, so each icon is the nearest Unicode glyph.
