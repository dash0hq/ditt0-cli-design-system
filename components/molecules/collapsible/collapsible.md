# Collapsible

A section that opens and closes under its title.

Storybook: `Components/Layout/Collapsible` · Stories: `components-layout-collapsible--*`

## When not to use it

- **Switching between views of the same thing:** use [Tabs](../tabs/tabs.md).
- **Content a person always needs:** show it. A closed section hides it.

## Quick start

```jsx
import { Collapsible } from '../components/molecules/collapsible/collapsible.jsx'

<Collapsible title="Span attributes" meta="3" open={open} onOpenChange={setOpen}>
    {attributes}
</Collapsible>
```

## Variants

The title is a press: `▸` while closed and `▾` while open. The content is drawn under it, indented by two cells, only while open. `meta` is a dim note after the title, such as a count, that stays when the section is closed.

<Canvas story="components-layout-collapsible--default" />

<Canvas story="components-layout-collapsible--open" />

## Do and don't

**Do** give a count in `meta`, so a closed section says how much it holds.

**Don't** nest more than two levels. Deeper sections lose their indent at terminal widths.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | string | required | The section's name and its press |
| `open` | boolean | `false` | Whether it is open |
| `onOpenChange` | `(open) => void` | none | Runs with the state a press asks for |
| `meta` | string | none | A dim note after the title |
| `id` | string | the title | Its address |
| `children` | elements | none | The content shown when open |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | `▸ title  meta` | The same | The same |

## Source of truth

- Dash0's web Collapsible (Radix): `open` and `onOpenChange` keep its names.
