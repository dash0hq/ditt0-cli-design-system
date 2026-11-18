# Box

A flex container that lays other components out in a row or a column, with space between and around them.

Storybook: `Components/Layout/Box` · Stories: `components-layout-box--*`

## When not to use it

- **Text alone:** a [Text](../text/text.md) needs no Box around it.

## Quick start

```jsx
import { Box } from '../components/box/box.jsx'

<Box direction="row" gap={1}>
    <Badge label="Critical" color="critical" />
    <Text>checkout-service p99 latency</Text>
</Box>
```

## Variants

**Column.** The default. Use it to stack a pane's parts.

**Row.** Use it to put a label beside its value, or a badge beside its subject.

**Bordered.** Use it to set a group apart, such as one service's numbers among several. The border is dim and rounded.

## Do and don't

**Do** use gaps for space between parts. Spaces typed into text break when the text changes length.

**Don't** nest bordered boxes. Two borders cost four columns and read as clutter.

## Accessibility

- A Box draws nothing a screen reader reads. Order the children in the order they should be read.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `direction` | `'column' \| 'row'` | `'column'` | Stack or line up the children |
| `gap` | number or `'xs'`...`'xl'` | `0` | Space between children |
| `padding` | number or `'xs'`...`'xl'` | `0` | Space inside the edge |
| `border` | boolean | `false` | A dim rounded border |
| `children` | elements | none | What it holds |

## Surfaces

The same on every surface. Numbers count terminal cells. On desktop and mobile they scale with the font.

## Source of truth

- Dash0 has no Box component. Spacing follows Tailwind's scale. A mod's steps are cells, not pixels.
