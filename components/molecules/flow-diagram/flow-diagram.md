# FlowDiagram

A Mermaid diagram drawn as boxes and arrows in box-drawing glyphs: how a request moves through services, who calls whom, the states a check goes through.

Storybook: `Components/Data/FlowDiagram` · Stories: `components-data-flowdiagram--*`

## When not to use it

- **Numbers:** a Mermaid `pie`, `xychart` or `gantt` draws with [PieChart](../charts/pie-chart/pie-chart.md), [BarChart](../charts/bar-chart/bar-chart.md) or [Timeseries](../charts/timeseries/timeseries.md), and [GanttChart](../charts/gantt-chart/gantt-chart.md), from their data, in the chart palette, with hover cards. FlowDiagram says so in their place.
- **A diagram of more than about 80 lines:** split it. The layout gets slow past that, and FlowDiagram says the diagram is too large.

## Quick start

```jsx
import { FlowDiagram } from '../components/molecules/flow-diagram/flow-diagram.jsx'

<FlowDiagram source={`flowchart TD
    api[api] --> auth{Token valid?}
    auth -->|yes| cp[order-history-api]`} />
```

## Variants

Boxes and labels are in the theme's text, so they read as the things. The lines between them are dim, so they read as links, not boxes. Arrowheads are in Dash0's primary purple, the one accent, so each link's direction shows at a glance.

**Flowchart.** `flowchart` or `graph`, `TD` or `LR`. A decision `{…}` has ◇ corners; edge labels sit on their lines.

<Canvas story="components-data-flowdiagram--default" />

**Fitting the width.** The diagram fits the Box it sits in where it can: a left-to-right flowchart too wide for it turns top-down, then its edge labels are cut to 24 and then 12 characters. Still too wide, it is cut at the Box's edge, with a dim note saying how wide it is.

<Canvas story="components-data-flowdiagram--pipeline" />

**Sequence.** `sequenceDiagram`: each participant at the top and the bottom, calls in order, replies dashed.

<Canvas story="components-data-flowdiagram--sequence" />

**State.** `stateDiagram-v2`: states as boxes, transitions labelled, `[*]` as the start and end.

<Canvas story="components-data-flowdiagram--state" />

**Class.** `classDiagram`: each class with its fields and methods in bands of their own.

<Canvas story="components-data-flowdiagram--class" />

**Source it can't draw.** A kind it doesn't draw (an ER diagram, a mindmap), source with a syntax error, or none: an [EmptyState](../empty-state/empty-state.md) saying why, never an error.

<Canvas story="components-data-flowdiagram--unsupported" />

<Canvas story="components-data-flowdiagram--entity" />

<Canvas story="components-data-flowdiagram--invalid" />

## Do and don't

**Do** keep labels short. A long label makes the diagram wide, and it gets cut first.

**Don't** draw data as a diagram. Use the chart for it.

## Accessibility

- Direction is carried by the arrowhead's glyph (`▼ ► ◄`), not only by its colour.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `source` | string | `''` | The Mermaid text. `%%` comments and inline HTML tags are left out |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Box-drawing glyphs, fitted to its Box | The same | As written: the width is not known, so nothing turns or is cut |

## Source of truth

- Mermaid's syntax: [mermaid.js.org](https://mermaid.js.org/intro/syntax-reference.html). The layout is the Mermaid text renderer in `vendor/mermaid-text`.
