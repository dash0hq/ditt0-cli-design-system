# Pane

The layout of a pane beside the transcript: navigation on top, the open view under it, a dim line at the foot.

Storybook: `Templates/Claude Code/Pane` · Stories: `templates-claude-code-pane--*` · Level: template

## When not to use it

- **A result of something Claude did:** use [Tool Result](../tool-result/tool-result.md).

## Quick start

```jsx
import { PaneTemplate } from '../../templates/pane/pane.jsx'

<PaneTemplate nav={<Tabs value={view} onChange={setView} tabs={TABS} />} body={view === 'latency' ? latency : requests} footer="Esc closes" />
```

## Variants

**Default.** Nav, body and footer, a line apart. Every slot but body is optional.

## Do and don't

**Do** keep the nav to one row of tabs where you can. A docked pane is at most 45% of the window: 72 columns in a 160-column terminal.

**Don't** put the main content in the footer. It is dim, for hints and where-you-are lines.

## Accessibility

- Open the pane with `focus: true` so its hotkeys work at once, and `closeOnEscape: true` so Esc closes it.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `nav` | element | none | Tabs or other navigation |
| `body` | element | required | The open view |
| `footer` | string | none | A dim line at the foot |

## Surfaces

Claude Code docks a pane on the right from 110 columns, and inline below that. A docked pane is at most 45% of the window and always leaves the transcript 60 columns: 49 columns at 110, 72 at 160, 90 at 200. Open it with `columns: 90` at most, and design for about 72.

## Source of truth

- Dash0 has no pane: this is a Claude Code slot, opened with `$.ui.open` and drawn at `ui.render` for `Pane`.
