# Loader

Something on its way, such as a panel waiting for Dash0's answer: a moving glyph in Dash0's CTA purple, then what is loading.

Storybook: `Components/Feedback/Loader` · Stories: `components-feedback-loader--*`

## When not to use it

- **Progress you can measure:** use [Progress](../../molecules/progress/progress.md), which says how far along it is.
- **Nothing to show:** once the answer came and holds nothing, use [EmptyState](../../molecules/empty-state/empty-state.md).

## Quick start

```jsx
import { Loader } from '../components/atoms/loader/loader.jsx'

<Loader label="Loading from Dash0…" />
```

## Variants

The glyph moves by itself, on the surface's own frame clock (`loader.client.js`): the page draws nothing again while it waits. On mobile, which draws no Client, it stands still.

**Spin.** The default: a braille dot running round, as Claude Code's own spinner turns. Use it for a whole page or view loading.

<Canvas story="components-feedback-loader--default" />

**Pulse.** A square that swells and fades toward the page. Use it in each panel of a page, so several waiting together read calm, not busy.

<Canvas story="components-feedback-loader--pulse" />

<Canvas story="components-feedback-loader--panels" />

## Do and don't

**Do** say what is loading, ending in `…`: "Loading requests…".

**Don't** leave a loader up after an error: show the error, and when the page tries again ([EmptyState](../../molecules/empty-state/empty-state.md) `variant="error"`).

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | string | none | What is loading, drawn dim after the glyph |
| `variant` | `'spin' \| 'pulse'` | `'spin'` | The braille spinner, or the pulsing square |
| `id` | string | from the label | The loader's key, for two with one label on a page |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | `⠋ label`, moving | The same | The first frame, still |

## Source of truth

- The purple is `cta` in Dash0's semantic colour tokens, through [tokens.js](../../foundations/tokens/tokens.js); the pulse fades toward the raised background.
