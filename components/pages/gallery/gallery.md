# Gallery

Storybook inside Claude Code: every component on a page of its own, its doc with every story drawn live in it.

Level: page · No story of its own: it would draw itself

## When not to use it

- **To read a component's doc page outside Claude Code:** open its `.md` file, or Ditt0.

## Quick start

Type `/book` in Claude Code.

## Layout

**Header.** Dash0's logo first, in pixels ([Logo](../../atoms/logo/logo.md)), then `Ditt0` large in the pixel font ([Heading](../../atoms/heading/heading.md)) and a line saying what this is.

**Components.** One list down the left, as Storybook's sidebar, grouped by atomic level, in build order: Foundations, Atoms, Molecules, Organisms, Templates, then Examples (whole pages built from the components, under `pages/`). The open one is marked `▌` in the accent colour. Dash0's mark, without the wordmark, heads the sidebar. The sidebar is 14 columns, as wide as Ditt0 at its foot, a longer name cut with `…`, so the page keeps its width in a docked pane, which Claude Code caps at 45% of the window and opens 90 columns wide where there is room. In a pane too narrow for the sidebar and a page of 66 columns (the narrowest every chart is checked to fit, on its panel), 72 columns in a 160-column terminal, the sidebar starts collapsed, so the page takes the width. The `☰` at its top right collapses it to the `☰` alone, so the page takes the pane's width, and opens it again; hovered, it says which: "Collapse menu" or "Open menu". The sidebar never moves: the gallery is drawn exactly as tall as the pane's window, so the engine scrolls nothing, and the page scrolls itself, clipped and moved up by its own offset, which the hooks module keeps within the page's measured height. The wheel over the sidebar scrolls its own list, under the logo; the wheel elsewhere, the arrows and the page keys scroll the page. Each side has a scrollbar, one column: a dim track `│` and a thumb `┃` in the accent colour, as long as the share showing and as far down as it has scrolled; none while it all fits. A dim rule parts the header from the page. On a phone, a Select at the top, each option named with its level.

**Examples.** An Examples page is shown as itself, with no doc around it. Services Overview and Tracing draw live: opening one in the gallery asks Dash0 at once and every 30 seconds, as its own pane (`/dash0-dashboard`, `/dash0-tracing`) does, and leaving it or closing the gallery stops the asking unless that pane is open. Any other Examples page draws its first story alone.

**Page.** The component's name large, its level and category under it (`Molecules · Charts`), then its doc page, drawn from its `.md` file, to scroll through. A line of its own, `<Canvas story="<story id>" />`, draws that story live in the page, as Storybook's MDX `<Canvas of={...} />` does: put one under each variant it shows. Each story sits on a raised panel, a step lighter than the page with a border of its level (tokens.js `raised`, Dash0's level 2), so a component never reads as part of the text around it. Every story the page doesn't embed is drawn after it, under Stories, by name, so every variant is on the page. The page's own `# Title` line is left out, since the name is drawn above it.

A drawing holds 20,000 nodes at most, and a page of many charts (Timeseries has over twenty stories) passes it. Past a budget, a story waits behind `▸ Show <name>`; a press draws it, with the one shown before. Each story's keys start with its id (`elements.js` `scoped`), so two stories keying a control alike never clash on the page.

Under a story that has raised an action, "Action:" shows the last prop it called, as Storybook's actions panel does. A story that hasn't shows nothing.

A controlled component, such as Tabs or ChartCard, follows its own presses: its stories file names, in `argsOnAction`, the arg each action sets, and the gallery keeps that arg for the story, as a story using Storybook's `useArgs` does.

```jsx
export default { title: 'Components/Navigation/Tabs', component: Tabs, actions: ['onChange'], argsOnAction: { onChange: 'value' } }
```

## Do and don't

**Do** give a controlled component's stories `argsOnAction`. Without it, pressing a tab or a range logs the action and nothing on screen changes.

**Don't** add a story here by hand. Add it to its component's stories file, and the component's stories file to `stories.js`.

## Accessibility

- Every component in the list is a button, so the focus ring reaches each one. The gallery takes no hotkeys of its own, so a story's hotkeys never clash with it.

## Props

None. The hooks module keeps where the gallery is: the open component, its doc, and the last action and args of each story.

## Surfaces

Every surface. The terminal docks it on the right from 110 columns.

## Source of truth

- Story ids follow Storybook's rule, so `components-actions-button--default` here is the same story as in Dash0's Storybook.
- A story pane alone, `ditt0-story:<id>`, with `?theme=light` for the light colours, is what component tests mount.
