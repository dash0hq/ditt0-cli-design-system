# Select

One value picked from a list: a dataset, a service, a sort order.

Storybook: `Components/Inputs/Select` · Stories: `components-inputs-select--*`

## When not to use it

- **Two to five options worth seeing at once:** use [ChartControls](../../molecules/chart-controls/chart-controls.md)' toggles or [Tabs](../../molecules/tabs/tabs.md).
- **On or off:** use [Switch](../switch/switch.md).

## Quick start

```jsx
import { Select } from '../components/atoms/select/select.jsx'

<Select id="dataset" label="Dataset" options={[{ value: 'default' }, { value: 'staging-shared' }]} value={dataset} onValueChange={setDataset} />
```

## Variants

The engine's Select, with a label that is always shown.

<Canvas story="components-inputs-select--default" />

**Values as labels.** An option without a `label` shows its value.

<Canvas story="components-inputs-select--services" />

## Do and don't

**Do** name what it picks: "Dataset", not "Choose a dataset".

**Don't** use a Select for two options. Toggles show both at once.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | required | Its address (the engine's `key`) |
| `label` | string | required | What it picks, always shown |
| `options` | `[{ value, label }]` | required | At least one; values unique |
| `value` | string | none | The picked option's value; the page keeps it |
| `onValueChange` | `(value) => void` | none | Runs with the option picked |
| `autoFocus` | boolean | none | Takes the focus when drawn |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | The engine's Select | The engine's Select | Each option a press, keyed `<id>-<value>`, the picked one bright: the mobile app draws no Select yet |

## Source of truth

- Dash0's web Select (Radix): `value` and `onValueChange` keep its names.
