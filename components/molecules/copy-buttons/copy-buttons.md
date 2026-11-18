# CopyButtons

Two quiet buttons under a table, chart or diagram that put it on the clipboard: Copy markdown, for a doc, a PR or an issue, and Copy text, the drawing as it stands, without its colours.

Storybook: `Components/Actions/CopyButtons` · Stories: `components-actions-copybuttons--*`

## When not to use it

- **Under a Table:** give the [Table](../table/table.md) `copy` instead. It writes both texts for you.
- **One action the view is for:** use a [Button](../../atoms/button/button.md) with its own label.

## Quick start

```jsx
import { CopyButtons } from '../components/molecules/copy-buttons/copy-buttons.jsx'
import { markdownTable } from '../components/copy.js'

<CopyButtons markdown={markdownTable(columns, rows)} text={drawnText} id="services-copy" />
```

## Variants

Both buttons are transparent, so they never compete with the content above them. Pressing one copies through Claude Code's clipboard (the terminal's clipboard tool, or an OSC 52 write) and a toast says `Copied`, or why nothing was: `Couldn't copy: this terminal has no clipboard Claude Code can reach`.

`components/copy.js` writes the texts: `markdownTable(columns, rows)` a GitHub table, a `|` in a value escaped, right-aligned columns `---:`; `plainText(text)` the text with its escape sequences out and trailing spaces cut.

<Canvas story="components-actions-copybuttons--default" />

**One text.** A button whose text is missing is left out.

<Canvas story="components-actions-copybuttons--markdown-only" />

## Do and don't

**Do** put them under the thing they copy, once per thing.

**Don't** label them anything else: Copy markdown and Copy text are the two names, everywhere.

## Accessibility

- The toast says what happened, so a copy never passes silently.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `markdown` | string | none | What Copy markdown copies. Without it, no Copy markdown |
| `text` | string | none | What Copy text copies, its escape sequences taken out. Without it, no Copy text |
| `id` | string | `'copy'` | What the buttons' keys start with (`<id>-markdown`, `<id>-text`), so two on one page don't share a key |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Two transparent buttons in a row | The same | The same |

## Source of truth

- The terminal's own: Claude Code's clipboard and its toasts. Labels and toast not yet checked against Dash0's Storybook.
