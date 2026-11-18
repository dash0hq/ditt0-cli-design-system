# Logo

Dash0's logo and Ditt0, the product design agent, drawn in pixels: quadrant blocks, four pixels to a cell.

Storybook: `Components/Brand/Logo` · Stories: `components-brand-logo--*`

## When not to use it

- **A page's title:** use [Heading](../heading/heading.md).
- **Every page:** the logo belongs in a header, once, such as the gallery's. A tool result doesn't need one.

## Quick start

```jsx
import { Dash0Logo, Ditt0Logo } from '../components/atoms/logo/logo.jsx'

<Dash0Logo />
<Ditt0Logo id="ditt0-logo" />
```

## Variants

**Dash0.** The mark, a half disc beside a full circle, coral at the top to red at the foot as Dash0's gradient runs, then the `dash0` wordmark in lower case. Three lines tall.

<Canvas story="components-brand-logo--default" />

**Small.** `size="small"`: two lines, where three are too many. The wordmark in four pixel rows.

<Canvas story="components-brand-logo--small" />

**Mark.** The mark alone, `wordmark={false}`, where the name is already written.

<Canvas story="components-brand-logo--mark" />

**Ditt0.** Fourteen cells by six, pink. In the terminal it's a `Raster`, which a hooks module repaints with `$.ui.blit` to animate it: `ditt0-body.js` gives the frames (`frame({ pose, mood, seconds, doneFor })`), and moods `idle` (breathes and blinks), `thinking`, `working` and `done` (hops).

<Canvas story="components-brand-logo--ditt0" />

## Do and don't

**Do** stop the clock that animates Ditt0 when its pane closes (`ui.close`).

**Don't** recolour the logo. Its colours are Dash0's and Ditt0's own.

## Props

| Component | Prop | Type | Default | What it does |
| --- | --- | --- | --- | --- |
| `Dash0Logo` | `wordmark` | boolean | `true` | Draws `dash0` beside the mark |
| `Dash0Logo` | `size` | `'default' \| 'small'` | `'default'` | Three lines, or two |
| `Ditt0Logo` | `id` | string | `ditt0-logo` | The Raster's key, which `$.ui.blit` names |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Dash0 | Quadrant blocks | The same | The same |
| Ditt0 | A Raster, animatable | Its glyphs, still | Its glyphs, still |

## Source of truth

- Dash0's mark: the coloured Dash0 logo (the shape, `#FF8A67` to `#FA4A4D`).
- Ditt0: the body Ditt0 has on the web, sampled into terminal glyphs.
