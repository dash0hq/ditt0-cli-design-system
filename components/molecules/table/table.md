# Table

Rows of values in columns that line up, under a header: services and their rates, a doc's props.

Storybook: `Components/Data/Table` · Stories: `components-data-table--*`

## When not to use it

- **Values to compare by size:** use [BarChart](../charts/bar-chart/bar-chart.md).
- **One value per name, a few of them:** write them as [Text](../../atoms/text/text.md).

## Quick start

```jsx
import { Table } from '../components/molecules/table/table.jsx'

<Table
    columns={[{ key: 'service', label: 'Service' }, { key: 'rate', label: 'Requests', align: 'right' }]}
    rows={[{ service: 'api', rate: '1128/s' }]}
/>
```

## Variants

The header is bold with a dim rule under it, so it never reads as a row. Each column is as wide as its longest value, and the room left over is shared out, so the table fills the Box it sits in. In a Box too narrow for it, the short columns stay whole, so numbers are never cut, and the long ones shrink and cut their values with `…`. Where the width isn't known (mobile), each column takes a share of the width by its longest value. `` `code` `` in a cell is drawn in the accent colour.

**Default.** Every value on one line, cut with `…` when too long for its column, so rows scan (the content guidelines' TRUNC-005). Right-align numbers.

<Canvas story="components-data-table--default" />

**Wrapped.** `wrap`: long values wrap onto more lines, a dim rule between rows. For prose, such as the props tables on these doc pages, which draw with it.

<Canvas story="components-data-table--wrapped" />

**Lined.** `variant` draws lines between the cells, for a table that stands alone rather than one that sits in a page. The columns are as wide as their longest value while the Box has room, and shrink to fit it when it hasn't, none narrower than its longest word while that fits, so the lines always meet.

- `'minimal'`, the default: the look above.
- `'rules'`: a dim rule under the header and between rows.
- `'grid'`: a heavy rule under the header, dim ones between rows, the columns further apart.
- `'box'`: every cell boxed, a double rule under the header.

<Canvas story="components-data-table--rules" />

<Canvas story="components-data-table--grid" />

<Canvas story="components-data-table--box" />

With `wrap`, a boxed value wraps inside its column, the bars running down every line of the row.

<Canvas story="components-data-table--box-wrapped" />

**Copy.** `copy` adds [CopyButtons](../copy-buttons/copy-buttons.md) under the table: Copy markdown puts it on the clipboard as a GitHub table, its alignment kept; Copy text as the terminal draws it, every column at its natural width, in the variant's lines, without colours.

## Do and don't

**Do** right-align numeric columns, with the unit on every value, so the digits line up (UNIT-002).

**Don't** wrap values in a table people scan, such as a list of services. Cut them, and keep the full value somewhere it can be read.

## Accessibility

- Header and body differ by weight and the rule, not by colour.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `columns` | `{ key, label, align? }[]` | required | The columns, in order. `align: 'right'` for numbers |
| `rows` | `{ [key]: string }[]` | required | A row each, its values by column key |
| `wrap` | boolean | `false` | Wrap long values instead of cutting them |
| `variant` | `'minimal' \| 'rules' \| 'grid' \| 'box'` | `'minimal'` | The lines drawn between cells |
| `copy` | boolean | `false` | Copy markdown and Copy text buttons under the table |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Columns at their natural widths, the room left shared, a rule under the header; lined variants at their natural widths, shrunk to fit | The same | Columns sharing the width by their longest values |

## Source of truth

- Dash0's web tables (grid table, table card): sorting, filters and column settings don't come over yet. Title not yet checked against Dash0's Storybook.
