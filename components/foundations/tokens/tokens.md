# Colors

Dash0's colours as this library draws them: the status colours, the Badge's fills and the chart palette, in a dark and a light set.

Storybook: `Foundations/Colors` · Stories: `foundations-colors--*`

Every value here follows Dash0's web design system (its semantic, level and palette tokens) and is set in [tokens.js](tokens.js). When a value changes there, change it here.

Code outside Claude Code reads the same values from two generated files: [tokens.json](tokens.json), for any language, and [go/ditt0/tokens_gen.go](../../../go/ditt0/tokens_gen.go), for Go. After changing tokens.js, run `node scripts/export-tokens.mjs` to rewrite them; `node scripts/export-tokens.mjs --check` fails while either is out of date. Never edit them by hand. The same script writes [go/ditt0/constants_gen.go](../../../go/ditt0/constants_gen.go): the fixed values the Go package draws with (glyphs, rows, round steps, big digits, unit steps), from the JS modules that own them (`*.constants.js`, [units.js](../units/units.js)), so Go never repeats them by hand.

## When not to use it

- **Text levels** (default, subtle, intense): use [Text](../../atoms/text/text.md). It maps them to the theme's own text colour and dim, not to hex.

## Quick start

```js
import { status, series, severity } from '../../foundations/tokens/tokens.js'

status('error').inline   // the error colour for text on a plain surface
series(0)                // the chart palette's first colour
severity('WARN').bg      // a log severity's fill
```

Components read these for you. Reach for them only in a new component.

## Variants

**Status.** Use it for anything with a state: `error`, `warning`, `info`, `healthy`, `debug`, `unknown`, and `cta` for the main action. Each has `bg` (a fill), `text` (the ink on that fill) and `inline` (text on a plain surface).

<Canvas story="foundations-colors--default" />

**Badge.** The Badge's own fills, which predate the status colours. Use them only through [Badge](../../atoms/badge/badge.md).

<Canvas story="foundations-colors--badge" />

**Chart palette.** The auto palette's nine colours, as the web palette lists them. Dark and light are different orders, not one palette reshaded. Don't colour series with `series(i)`: charts get their colours from the [Color Manager](../color-manager/color-manager.md), which hands these out by name and meaning.

<Canvas story="foundations-colors--chart-palette" />

**Raised.** `raised()`: `{ bg, stroke }` for a panel a step lighter than the page, Dash0's level 2. The gallery draws each story on one.

## Do and don't

**Do** name a colour by what it means: `status('error')`. When Dash0 changes its error red, every component follows.

**Don't** write a hex value in a component. It drifts from Dash0's the first time Dash0 changes one.

**Do** use `inline` for coloured text and `bg` with `text` for a fill. Each pair keeps its contrast.

## Accessibility

- Every fill has its own ink, picked by Dash0 for contrast on that fill.
- Colour never carries meaning alone: components write the state in words too.

## Props

| Function | Returns |
| --- | --- |
| `status(name)` | `{ bg, text, inline }` for the theme |
| `badge(name)` | A Badge fill for the theme |
| `series(i)` | The palette's colour `i`, repeating past nine |
| `severity(level)`, `spanStatus(code)` | The status a log severity or span status takes |
| `palette()` | Every group for the theme, as the Colors story draws them |

The `Colors` component behind the story takes `group`: `'status'`, `'badge'` or `'series'`.

## Surfaces

The same on every surface. The theme is the person's `/config` theme: anything not named light draws with the dark set.

## Source of truth

| Group | In Dash0's web design system |
| --- | --- |
| Status | The semantic colour tokens, dark and light |
| Badge | The Badge component's own colours |
| Chart palette | The default ("auto") chart palette |
| Log severity, span status | The log severity and span status palettes |
