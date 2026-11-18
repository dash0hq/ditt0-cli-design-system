# Tool Result

The layout of what draws under a tool call in the transcript: the result, a line about what it leaves out, then actions on it.

Storybook: `Templates/Claude Code/Tool Result` · Stories: `templates-claude-code-tool-result--*` · Level: template

## When not to use it

- **A view someone opens and works in:** use [Pane](../pane/pane.md). A tool result sits in the transcript and scrolls away.

## Quick start

```jsx
import { ToolResultTemplate } from '../../templates/tool-result/tool-result.jsx'

<ToolResultTemplate
    body={<Timeseries series={series} times={times} />}
    notice="Showing 8 of 30 series"
    actions={[<Link href={url} label="Open in Dash0" />]}
/>
```

## Variants

**Body only.** Use it when the result is complete as drawn.

**With notice and actions.** Use the notice when the body leaves something out, such as series past the first eight. Use actions for what to do next, such as opening the query in Dash0.

## Do and don't

**Do** say in the notice what was left out and where to find it. People trust a chart more when they know its limits.

**Don't** repeat the tool's name or input in the body. Claude Code draws the call's row right above it.

## Accessibility

- Slots draw in reading order: body, notice, actions.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `body` | element | required | What the call found |
| `notice` | string | none | A dim line about what the body leaves out |
| `actions` | elements | `[]` | Buttons or links, in a row |

## Surfaces

Claude Code draws it in two places: under a call on its own row (a `ToolResult`), and under a folded group of calls ("Called Dash0", a `ToolGroup`). The mount in `hooks/register.jsx` handles both.

## Source of truth

- Dash0 has no tool result layout: this is a Claude Code slot. Its spacing follows Dash0's Templates rule of layout primitives and neutral placeholders.
