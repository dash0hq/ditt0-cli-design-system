# Hello Tabs

The first mod's pane: a tab per demo, from a counter to 24 hours of Dash0 request rates.

Storybook: `Features/Hello Tabs/Pages/Hello Tabs` · Stories: `features-hello-tabs-pages-hello-tabs--*` · Level: page

## When not to use it

- **To see the components:** use the gallery, `/book`. This page is a demo.

## Quick start

Type `/hello-tabs` in Claude Code.

## Variants

**One** to **Six:** text, a counter with a bar chart, latency, request rates, a 24 hour stress run, and three overlapping series.

## Do and don't

**Do** keep state in the mount, not the page. The page draws what it is given and asks for changes through `onTabChange` and `onCount`.

## Accessibility

- Tabs 1 to 6 and `a` (add one) work as hotkeys once the pane has the focus.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `tab` | `'one'`...`'six'` | `'one'` | The open tab |
| `count` | number | `0` | The counter's value |
| `onTabChange` | `(tab) => void` | none | Runs with a tab's value when it is pressed |
| `onCount` | `() => void` | none | Runs when "add one" is pressed |

## Surfaces

Every surface. On desktop and mobile the bar chart is an SVG.

## Source of truth

- Built from [Pane](../../templates/pane/pane.md), [Tabs](../../molecules/tabs/tabs.md), [BarChart](../../molecules/charts/bar-chart/bar-chart.md) and [Timeseries](../../molecules/charts/timeseries/timeseries.md), with the snapshots in `fixtures/`.
