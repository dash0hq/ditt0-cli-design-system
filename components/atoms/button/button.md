# Button

An action someone takes from a pane or a band: open a view, create a rule, delete a dashboard.

Storybook: `Components/Actions/Button` · Stories: `components-actions-button--*`

## When not to use it

- **Moving to a page outside Claude Code:** use [Link](../link/link.md).
- **Switching between views of one pane:** use [Tabs](../../molecules/tabs/tabs.md).

## Quick start

```jsx
import { Button } from '../components/button/button.jsx'

<Button label="Open in Dash0" onClick={openDash0} />
```

## Variants

Three levels, by how much the action matters. One primary per view; the rest secondary; quiet ones tertiary.

<Canvas story="components-actions-button--hierarchy" />

**Cta (primary).** The one action most people came to do, such as creating a check rule: filled in Dash0's CTA purple, its border too, the label in the CTA ink.

```jsx
<Button label="Create check rule" hotkey="c" variant="cta" onClick={create} />
```

**Default (secondary).** An outline: a rounded border in level 2's colour round the label, no fill, three rows high, so it reads as a control and not as text.

```jsx
<Button label="Open in Dash0" onClick={openDash0} />
```

**Transparent (tertiary).** An action inside other content that must not compete with it, such as "Show 22 more series" under a chart, or a chart's zoom: the label alone, one row high.

```jsx
<Button label="Show 22 more series" variant="transparent" onClick={showAll} />
```

**Destructive.** An action that deletes something or can't be undone: an outline and label in Dash0's error colour.

```jsx
<Button label="Delete dashboard" variant="destructive" onClick={confirmDelete} />
```

**Toggles.** In a row of outlined buttons that change what a view shows, such as a chart's ranges, `selected` marks the one that is on: its border takes the accent colour; the others' border and label are dim. Leave `selected` out for an action.

<Canvas story="components-actions-button--toggles" />

```jsx
<Button label="24h" selected={range === '24h'} onClick={() => setRange('24h')} />
```

## Do and don't

**Do** name the action with a verb and its object: "Create check rule". It says what happens before the press.

**Don't** label a button "OK" or "Submit". Someone reading the pane later can't tell what it did.

**Do** give the main action, the one CTA, a hotkey. Only a CTA takes one: a key on every control is too many to learn.

**Don't** put two CTAs with hotkeys in one pane. The later one wins.

## Accessibility

- The label is the button's accessible name on desktop and mobile. Keep it readable without the hotkey.
- A hotkey is one digit or one lowercase letter. It works only while the pane or band has the focus, never from the prompt.
- Destructive actions still need a confirmation step. The colour alone doesn't tell everyone that the action is destructive.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | string | required | The text on the button, and its name for presses and tests |
| `onClick` | `() => void` | none | Runs when the button is pressed |
| `hotkey` | one digit or lowercase letter | none | For `variant="cta"` only: presses it while the pane has the focus. Left off on any other variant, unless `shortcut` |
| `shortcut` | boolean | `false` | Keeps `hotkey` on any variant, for the few keys worth learning: a chart's zoom (`i`, `o`, `r`) |
| `variant` | `'cta' \| 'default' \| 'transparent' \| 'destructive'` | `'default'` | Primary (purple fill), secondary (outline), tertiary (label alone), or destructive |
| `id` | string | the label | The button's address, when two buttons share a label |
| `selected` | boolean | none | In a row of toggles: `true` for the one on (accent border), `false` for the others (dim). None for an action |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | A purple fill (cta, `h: label` with its hotkey) or an outline, the label inside; transparent: the label alone | The same | The same, no hotkeys |
| Hotkey | Yes, with the focus | Yes, with the focus | No keyboard |

## Source of truth

- Variants: Dash0's web Button.
- Error colour: Dash0's semantic colour tokens, through [tokens.js](../../foundations/tokens/tokens.js).
- Left out: `outline`, `selected`, `textLink`, `cta-brand` and `input`, which differ from the others only by CSS a terminal can't draw. Sizes are left out too, because a terminal button is one row high at any size. `onClick` is Storybook's name for what a mod calls `onPress`.
