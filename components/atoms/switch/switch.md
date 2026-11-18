# Switch

A setting that is on or off and takes effect at once, such as auto-refresh.

Storybook: `Components/Inputs/Switch` · Stories: `components-inputs-switch--*`

## When not to use it

- **Picking one of a few options:** use [ChartControls](../../molecules/chart-controls/chart-controls.md)' toggles or [Tabs](../../molecules/tabs/tabs.md).
- **An action that runs once:** use [Button](../button/button.md).

## Quick start

```jsx
import { Switch } from '../components/atoms/switch/switch.jsx'

<Switch label="Auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
```

## Variants

As tall as a [Button](../button/button.md): three rows, in the same rounded border, so a switch beside buttons lines up with them. Inside, two squares, each `██` (a cell is twice as tall as wide): the knob and its slot, the slot in the border's colour. Off, the knob is left and grey. Each square is its colour on a background of the same colour, so the pointer's and the focus's inversion keep it. On, it is right, in Dash0's CTA purple. The label after it is part of the press, and Tab and Enter reach it as any Button.

<Canvas story="components-inputs-switch--default" />

<Canvas story="components-inputs-switch--checked" />

**Disabled.** Dim, and a press changes nothing.

<Canvas story="components-inputs-switch--disabled" />

**Settings.** Several switches, one under another.

<Canvas story="components-inputs-switch--settings" />

## Do and don't

**Do** name the setting, not the action: "Auto-refresh", not "Turn on auto-refresh".

**Don't** use a switch for something that waits for a Save. A switch takes effect when pressed.

## Accessibility

- The label is the switch's name; the squares are its state. On and off differ by the knob's side as well as its colour.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | string | required | What the switch turns on, and its name for presses and tests |
| `checked` | boolean | `false` | Whether it is on |
| `onCheckedChange` | `(checked) => void` | none | Runs with the value a press asks for |
| `disabled` | boolean | `false` | Dim; a press changes nothing |
| `id` | string | the label | The switch's address, when two share a label |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | `╭─╮` border, `██ ██ label` | The same | The same |

## Source of truth

- Dash0's web Switch (Radix): `checked` and `onCheckedChange` keep its names. The knob's colour is `cta` in Dash0's semantic colour tokens, through [tokens.js](../../foundations/tokens/tokens.js).
