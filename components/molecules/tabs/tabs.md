# Tabs

A row of views of one pane, one open at a time: Latency, Requests, Errors.

Storybook: `Components/Navigation/Tabs` · Stories: `components-navigation-tabs--*`

## When not to use it

- **Running an action:** use [Button](../../atoms/button/button.md).
- **Moving to another page:** use [Link](../../atoms/link/link.md).

## Quick start

```jsx
import { Tabs } from '../components/tabs/tabs.jsx'

<Tabs
    value={view}
    onChange={setView}
    tabs={[
        { value: 'latency', label: 'Latency', hotkey: '1' },
        { value: 'requests', label: 'Requests', hotkey: '2' },
    ]}
/>
```

Draw the open tab's content under it yourself.

## Variants

**Default.** `variant="text"`: the open tab is drawn at full strength and the others dim. For tabs over a view's content.

**Buttons.** `variant="buttons"`: each tab in a rounded border, the open one's in the accent colour, the others dim ([Button](../../atoms/button/button.md) toggles, `selected`). For a row of toggles that change what a view shows, such as a chart card's ranges, where dim and bright labels alone read as text.

<Canvas story="components-navigation-tabs--buttons" />

## Do and don't

**Do** number the tabs' hotkeys in order: 1, 2, 3. People read the number as the position.

**Don't** use tabs for steps someone has to do in order. Tabs say that the views are equal and any order works.

## Accessibility

- Each tab is a button whose label is its name. The open one is told apart by strength, so keep the labels distinct.
- Tabs work with hotkeys while the pane has the focus, and with the focus ring.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `tabs` | `{ value, label, hotkey? }[]` | required | The tabs, in order |
| `value` | string | required | The open tab's value |
| `onChange` | `(value) => void` | none | Runs with a tab's value when it is pressed |
| `gap` | number | `3` | Cells between tabs |
| `variant` | `'text' \| 'buttons'` | `'text'` | Labels alone, or each tab an outlined button |

Each tab's button has the key `tab-<value>`, which tests press.

## Surfaces

The same on every surface. Mobile has no keyboard, so hotkeys don't apply there.

## Source of truth

- Dash0's web Tabs are parts (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`). A mod's JSX draws children before their parent sees them, so here the tabs come as one list.
