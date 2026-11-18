# GanttChart

Tasks over time, a row each: a release's phases, a trace's spans, an incident's moments on the clock.

Storybook: `Components/Charts/GanttChart` · Stories: `components-charts-ganttchart--*`

## When not to use it

- **A value over time:** use [Timeseries](../timeseries/timeseries.md).
- **Who calls whom, not when:** use [FlowDiagram](../../flow-diagram/flow-diagram.md) with a sequence diagram.

## Quick start

```jsx
import { GanttChart } from '../components/molecules/charts/gantt-chart/gantt-chart.jsx'

<GanttChart tasks={[
    { section: 'Build', label: 'FlowDiagram', start: '2026-10-19', end: '2026-10-30' },
    { section: 'Launch', label: 'Ditt0 1.0', start: '2026-11-18', milestone: true },
]} />
```

## Variants

A row per task: its name at the left, its bar along the time axis. The axis is on top, ticked at steps that keep its labels apart, with dim guidelines down through the rows. A bar's start lands to half a cell (`▐`) and its end to an eighth (`▏▎▍▌▋▊▉`); a bar shorter than a cell is one `█`, never nothing. Hovering a task lights its name and bar and shows its card beside the bar: name, start → end, and duration. A card under one of the last rows moves up so it ends on the chart's last line, never past it.

**Sections.** Sections head their tasks, in the order given, the tasks indented under them. A task without a colour takes the [Color Manager](../../../foundations/color-manager/color-manager.md)'s for its `series`, else its section, else its label, as a bar of that name does in any chart.

<Canvas story="components-charts-ganttchart--default" />

**A trace.** Under a minute, the axis reads the time since the first start, in one scale (0 ms, 100 ms, 200 ms). Spans coloured by service; a span with `otel.span.status.code: ERROR` in its attributes is the error red.

<Canvas story="components-charts-ganttchart--waterfall" />

**Milestones.** A task with `milestone` and a start alone is a `◆` at its time. Under two days the axis reads the clock, in local time; longer, the day.

<Canvas story="components-charts-ganttchart--milestones" />

**No data.** `no data`, dim.

<Canvas story="components-charts-ganttchart--no-data" />

## Do and don't

**Do** give tasks that belong together a section, so they share a colour and a heading.

**Don't** colour bars by hand for meaning. Give the task attributes, and the Color Manager colours it as Dash0 does.

## Accessibility

- Every task is named on its row, and its card gives its times as text, so colour never carries it alone.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `tasks` | `[{ label, section, start, end, milestone, color, series, attributes }]` | `[]` | The tasks. `start` and `end` in ms, a Date or an ISO string; a milestone has a start alone. Names past 22 characters are cut with `…` |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Fills its Box, the track 10 to 60 cells | The same | The track 60 cells |

## Source of truth

- Mermaid's `gantt`: the same tasks, sections and milestones, drawn from data. Dash0's trace waterfall for spans. Not yet checked against Dash0's Storybook.
