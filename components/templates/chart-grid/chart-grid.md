# Chart Grid

Charts side by side on a page, each near the width a chart reads best, about 500 px, and filling its share of the pane.

> **Try it:** drag the pane's edge to make it wider, then narrower. The charts below grow, split into columns, and stack again.

Storybook: `Templates/Claude Code/Chart Grid` · Stories: `templates-claude-code-chart-grid--*` · Level: template

## When not to use it

- **One chart in a tool result:** use [Tool Result](../tool-result/tool-result.md). A chart alone fills its pane.
- **Numbers in a row:** a row Box with `flexWrap`. Stats are short and don't need a chart's width.

## Quick start

```jsx
import { ChartGrid } from '../../templates/chart-grid/chart-grid.jsx'

<ChartGrid id="red">
    <ChartCard title="Requests">…</ChartCard>
    <ChartCard title="Errors">…</ChartCard>
    <ChartCard title="Duration">…</ChartCard>
</ChartGrid>
```

## Variants

**Default.** A chart reads best at about `CHART_MAX`, 64 cells, about 500 px at a terminal's usual 8 px cell. The grid measures the pane and takes as many columns as cells of that width (a chart and its card's frame, 68 cells) fit, rounded, never more than there are charts. The cells share the width evenly, so the charts always fill it and grow with the pane. When there's room for one more chart near its best width, the grid adds a column. The last row keeps the others' width. Until measured, and on mobile, the charts stack in one column.

<Canvas story="templates-claude-code-chart-grid--default" />

**Responsive.** `columns={2}`: two charts side by side while each keeps near its best width, one under the other when the pane is too narrow for two. **Try it:** make the pane wider until the two charts sit side by side, then narrower until they stack.

<Canvas story="templates-claude-code-chart-grid--responsive" />

## Do and don't

**Do** give each grid an `id` unique on the page. It names the region the grid measures.

**Do** put cards in it: [Chart Card](../../organisms/chart-card/chart-card.md), or a page's own card around a chart.

**Don't** set a chart's width yourself. Let the grid share the width, and cap its columns with `columns` when a layout wants at most two.

## Accessibility

A grid reads in order, left to right, then row by row, as the charts are given.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | string | | Names the grid's measure region, unique on the page |
| `gap` | number | `1` | Cells between columns |
| `children` | elements | | The charts, or cards holding them |
