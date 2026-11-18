# Text

A run of text in one of Dash0's text levels or status colours.

Storybook: `Foundations/Text` · Stories: `foundations-text--*`

## When not to use it

- **A state in one or two words:** use [Badge](../badge/badge.md).

## Quick start

```jsx
import { Text } from '../components/text/text.jsx'

<Text color="subtle">last 30 minutes, UTC</Text>
```

## Variants

**Default.** Use it for most text. It draws in the theme's own text colour.

**Subtle.** Use it for what supports the main text: a time range, a unit, a hint. It draws dim.

**Intense.** Use it for the one thing someone looks for first, such as a service name in a row. It draws bold.

**Status colours.** Use `error`, `warning`, `info`, `healthy`, `debug` or `unknown` for text about that state, such as a failed check. `cta` is the main action's colour.

**Mono.** Use it for code and queries, such as PromQL. The terminal is monospace already, so it changes desktop and mobile.

## Do and don't

**Do** let default and subtle text follow the theme. Dash0's text levels are greys picked for its own backgrounds, so here they map to the terminal's own text colour and dim.

**Don't** colour a whole paragraph with a status colour. Colour the part that names the state.

## Accessibility

- Status colours repeat what the words say. Write the state in the text too.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `children` | string | required | The text |
| `color` | `'default' \| 'subtle' \| 'intense' \| 'error' \| 'warning' \| 'info' \| 'healthy' \| 'debug' \| 'unknown' \| 'cta'` | `'default'` | A text level or a status |
| `weight` | `'regular' \| 'medium' \| 'bold'` | `'regular'` | How heavy it is |
| `mono` | boolean | `false` | Monospace, for code |
| `wrap` | `'wrap'` | none | Breaks a sentence onto more lines when the pane is narrower than it. Set it on prose; leave it off labels and values |

## Surfaces

The terminal ignores `mono`, because it is monospace already.

## Source of truth

- Levels: Dash0's level tokens (`text-lvl-intense`, `text-lvl`, `text-lvl-subtle`). Mapped to the theme's text colour, not set as hex.
- Status colours: Dash0's semantic colour tokens, each status' `text-inline`, through [tokens.js](../../foundations/tokens/tokens.js).
