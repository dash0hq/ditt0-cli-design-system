# Ditt0 components for Claude Code

By Luca Ucciero (luca.ucciero@dash0.com), Dash0.

Components for Claude Code mods, in Dash0's colours, drawn in the terminal, the desktop app and on mobile.

## Levels

Components are sorted by Brad Frost's atomic design levels, plus a logic layer.

| Level | Folder | What sits there | Here |
| --- | --- | --- | --- |
| Foundations | [foundations/](foundations) | Design tokens | [Colors](foundations/tokens/tokens.md), [Color Manager](foundations/color-manager/color-manager.md), [Units](foundations/units/units.md) |
| Atoms | [atoms/](atoms) | The smallest parts, useful alone | [Text](atoms/text/text.md), [Badge](atoms/badge/badge.md), [Button](atoms/button/button.md), [Link](atoms/link/link.md), [Switch](atoms/switch/switch.md), [Box](atoms/box/box.md), [Heading](atoms/heading/heading.md), [Logo](atoms/logo/logo.md), [Legend](atoms/legend/legend.md), [Tag](atoms/tag/tag.md), [Input](atoms/input/input.md), [Select](atoms/select/select.md) |
| Molecules | [molecules/](molecules) | A few atoms that work as one | [Tabs](molecules/tabs/tabs.md), [ChartControls](molecules/chart-controls/chart-controls.md), [Table](molecules/table/table.md), [FlowDiagram](molecules/flow-diagram/flow-diagram.md), [CopyButtons](molecules/copy-buttons/copy-buttons.md), [List](molecules/list/list.md), [Collapsible](molecules/collapsible/collapsible.md), [Banner](molecules/banner/banner.md), [EmptyState](molecules/empty-state/empty-state.md), [Progress](molecules/progress/progress.md); charts, in [molecules/charts/](molecules/charts): [BarChart](molecules/charts/bar-chart/bar-chart.md), [Timeseries](molecules/charts/timeseries/timeseries.md), [Stat](molecules/charts/stat/stat.md), [Gauge](molecules/charts/gauge/gauge.md), [PieChart](molecules/charts/pie-chart/pie-chart.md), [SquareChart](molecules/charts/square-chart/square-chart.md), [GanttChart](molecules/charts/gantt-chart/gantt-chart.md) |
| Organisms | [organisms/](organisms) | A whole section of an interface | [ChartCard](organisms/chart-card/chart-card.md), [SeriesTable](organisms/series-table/series-table.md), [FailedChecks](organisms/failed-checks/failed-checks.md), [Services](organisms/services/services.md) |
| Templates | [templates/](templates) | Claude Code's slots, laid out, with no content | [Tool Result](templates/tool-result/tool-result.md), [Pane](templates/pane/pane.md) |
| Pages | [pages/](pages) | A template filled with real content | [Query Result](pages/dash0-query-result/dash0-query-result.md), [Services Overview](pages/dash0-dashboard/dash0-dashboard.md), [Tracing](pages/dash0-tracing/dash0-tracing.md), [Hello Tabs](pages/hello-tabs/hello-tabs.md), [Spec Page](pages/spec-page/spec-page.md), [Gallery](pages/gallery/gallery.md) |
| Connectors | [../connectors/](../connectors) | The logic layer: data from outside, read into a page's props. No UI | [promql](../connectors/dash0/promql.md) (and `live.js`, which refreshes a result every 30 seconds); `live-page.js`, which keeps a whole page live; `spec-page.js`, which turns a JSON page spec into a live page. [Plug in another app's data](../connectors/README.md), [from another mod](../connectors/README.md#plug-in-from-another-mod) |

Where a page draws in Claude Code (under a tool call, in a pane) is decided in [hooks/register.jsx](../hooks/register.jsx), the mount layer. A page decides what it draws; the mount decides where, and keeps its state.

A level may use the levels above it, never the ones below: an atom never imports a molecule.

Components of one kind share a folder inside their level: every chart is in `molecules/charts/`, bars and lines alike. A new chart goes there too.

## Source of truth

This library follows the tokens, props and docs rules of Dash0's web design system.

| What | In the web design system | Here |
| --- | --- | --- |
| Status colours | The semantic colour tokens | [tokens.js](foundations/tokens/tokens.js) |
| Text levels | The level tokens | The theme's text colour and dim, see [Text](atoms/text/text.md) |
| Chart palette | The default ("auto") chart palette | [tokens.js](foundations/tokens/tokens.js) |
| Series colours | The color manager and its semantic colour coding | [color-manager.js](foundations/color-manager/color-manager.js) |
| Components and props | Its React components | One folder per component |
| Docs rules | Its guide for AI-readable docs | The doc page in each folder |
| Titles | Each `*.stories.tsx`' `title` | Each `*.stories.jsx`' `title` |

When a value changes in the dash0 repo, change it here, and say which file it came from.

The [Go package](../go/README.md) draws Timeseries, Stat, Button and ChartControls for terminal programs outside Claude Code, from the same tokens and constants, and is tested against goldens these components draw (`node scripts/export-goldens.mjs`): a change that moves how one of them draws means writing the goldens again, and Go then fails until it draws the same.

Dash0's Storybook doesn't sort by atomic levels yet. Until it does, story titles here keep Dash0's (`Components/Actions/Button`), so story ids match, and the level lives in the folder. When Dash0 moves to levels, the titles follow.

## Every component has

```
components/<level>/<name>/           or components/<level>/<kind>/<name>/, such as molecules/charts/bar-chart/
  <name>.jsx           the component: named props, each with a default
  <name>.stories.jsx   its stories, as Storybook writes them: a meta with title and component, a named export
                       per variant. The gallery lists Default first, then the others by name. A controlled
                       component's meta names, in argsOnAction, the arg each action sets: { onChange: 'value' },
                       or a function of the action's values giving the args to set, when one press sets several:
                       { onRangeChange: (range) => ({ range, zoom: undefined }) }
  <name>.md            its doc page, in the sections Dash0's docs guide asks for, plus Surfaces and Source of truth
                       <Canvas story="<id>" /> on a line of its own draws that story live in the page
  <name>.test.ts       its tests: each story mounted alone, on every surface it draws on
  <name>.constants.js  optional: the fixed values a component draws with (glyphs, rows, steps), with no imports,
                       for a component the Go package draws too: scripts/export-tokens.mjs writes them to Go
```

To add one:

1. Find it in Dash0's web design system and read its component and docs. Take its title, its prop names and its variants. Leave out what a terminal can't draw, and say so under Source of truth.
2. Pick its level. If it imports a component, it sits at least one level below it.
3. Write the four files. Use realistic Dash0 content in stories, never "Item 1".
4. Add its stories file to its level in [pages/gallery/stories.js](pages/gallery/stories.js).
5. Run `claude plugin test .` and `claude plugin validate .`.

## Using a component

```jsx
import { setElements } from '../components/elements.js'
import { Button } from '../components/atoms/button/button.jsx'

on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== 'my-pane') return next(e)
    // Components draw with the elements Claude Code hands this render
    setElements($.ui.resolve(e), e.surface)
    return <Button label="Open in Dash0" hotkey="o" onClick={open} />
})
```

Props go by name, in any order, and every prop that isn't required has a default. There is no framework: JSX, function components and redraws are Claude Code's own.

Charts fill the width of the Box they sit in: size them with their container, not a prop. A render isn't told that width, so a chart draws a measure region ([measure.js](measure.js)): a `Client` that reports its Box's width to the mount layer, which keeps it and draws again. A component that needs its width does the same: `measure(key)` in its tree, `widthOf(key)` to read it.

## For an AI building UIs

Other mods, and Claude itself, build pages from these components as plain JSON. A mod calls `$.ditt0.open(spec)` ([types/index.d.ts](../types/index.d.ts)), and Claude calls the `ditt0_show` tool. The blocks are listed in [Spec Page](pages/spec-page/spec-page.md); the wiring is in [connectors/README.md](../connectors/README.md#plug-in-from-another-mod).

[skills/ditt0-ui/SKILL.md](../skills/ditt0-ui/SKILL.md) is the guide an agent reads to build a UI from these components: how a tree gets on screen, which component fits which data, every component's props, recipes and rules. A change to a component's props updates it too.

## Seeing them

Type `/book-tour` for a [tour](pages/tour/tour.md) that plays itself: the design system, every way a chart draws, the live pages, plugging in and generative UI.

Type `/book` in Claude Code: the [gallery](pages/gallery/gallery.md) lists every component by name, and opens each on one page: its doc, with every story drawn live in it, to scroll through.

The levels sort the folders, not the gallery: find a component by its name.

Type `/dash0-dashboard` for an example with live data: the [Services Overview](pages/dash0-dashboard/dash0-dashboard.md), every panel asked from Dash0 again every 30 seconds. `/dash0-tracing` opens [Tracing](pages/dash0-tracing/dash0-tracing.md), on the same wiring. To plug in another app's data, see [connectors/README.md](../connectors/README.md).

## Testing a component

A test mounts one story by its Storybook id, on each surface:

```ts
const ui = await mountStory($, 'components-actions-button--default', 'terminal')
await ui.press({ key: 'Open in Dash0' })
expect(await ui.find({ type: 'Text', text: /Action: onClick\(\)/ })).toBeDefined()
```

Add `'light'` as a fourth argument to draw with Dash0's light colours.
