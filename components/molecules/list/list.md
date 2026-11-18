# List

Rows of things of one kind, one under another: services, checks, dashboards.

Storybook: `Components/Data/List` · Stories: `components-data-list--*`

## When not to use it

- **Several values per row worth comparing down a column:** use [Table](../table/table.md).
- **A filter or attribute:** use [Tag](../../atoms/tag/tag.md).

## Quick start

```jsx
import { List } from '../components/molecules/list/list.jsx'

<List items={[{ id: 'api', label: 'api', status: 'error', meta: '1.2K req/s' }]} selected={open} onSelect={setOpen} />
```

## Variants

Each row has a label. It can also have a status dot (`●` in the status colour), a dim description, a [Badge](../../atoms/badge/badge.md), and a meta value at the right edge.

**Pressable.** With `onSelect`, each row is a press keyed `item-<id>`. The `selected` row is bold, with a purple `▌` before it.

<Canvas story="components-data-list--default" />

**Read only.** Without `onSelect`, the rows can only be read.

<Canvas story="components-data-list--read-only" />

**Badges.** Failed checks, each with its severity.

<Canvas story="components-data-list--badges" />

## Do and don't

**Do** put the number a person scans for in `meta`, so it lines up at the right edge.

**Don't** colour a row by status without saying what it is. Use a Badge's word when the dot alone could be misread.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `items` | `[{ id, label, description, status, badge, meta }]` | required | The rows; `status` is a status name, `badge` is Badge's props |
| `selected` | string | none | The id of the open row |
| `onSelect` | `(id) => void` | none | Makes each row a press |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | `▌● label  description   Badge  meta` | The same | The same |

## Source of truth

- Dash0's list rows in the Services and Failed checks views. Status colours from Dash0's semantic colour tokens through [tokens.js](../../foundations/tokens/tokens.js).
