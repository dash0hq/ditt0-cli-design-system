# Input

A field a person types into: a name, a URL, a query.

Storybook: `Components/Inputs/Input` · Stories: `components-inputs-input--*`

## When not to use it

- **One value from a known list:** use [Select](../select/select.md).
- **On or off:** use [Switch](../switch/switch.md).

## Quick start

```jsx
import { Input } from '../components/atoms/input/input.jsx'

<Input id="dashboard-name" label="Dashboard name" value={name} onChange={setName} onSubmit={save} />
```

## Variants

The engine's Input, with Dash0's field rules from the content guidelines.

<Canvas story="components-inputs-input--default" />

**Placeholder.** Only a format example, such as `d4e5f6a7-…` (FIELD-002), never an instruction.

<Canvas story="components-inputs-input--placeholder" />

**Optional or required.** `optional` adds `(optional)` to the label, and `required` adds `*`. Use one pattern per form (FIELD-003).

<Canvas story="components-inputs-input--optional" />

**Invalid.** `error` is drawn under the field in the error colour. Say what to enter, as an instruction (FIELD-004, ERROR-003).

<Canvas story="components-inputs-input--invalid" />

**Several lines.** `rows` above 1, with a submit button named by `submitLabel`.

<Canvas story="components-inputs-input--multiline" />

**Form.** Fields one under another.

<Canvas story="components-inputs-input--form" />

## Do and don't

**Do** keep the label visible on every field (FIELD-001).

**Do** write errors as instructions: "Enter a name between 3 and 64 characters."

**Don't** write "Invalid input." or "This field is required."

## Accessibility

- The label is the field's name. The placeholder disappears once someone types, so it never carries meaning on its own.
- An error is text, not only colour.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | required | The field's address (the engine's `key`) |
| `label` | string | required | Always shown (FIELD-001) |
| `placeholder` | string | none | A format example (FIELD-002) |
| `value` | string | none | The text in the field; the page keeps it |
| `onChange` | `(value) => void` | none | Each edit as it is typed |
| `onSubmit` | `(value) => void` | none | Enter, or the submit button |
| `submitLabel` | string | none | Names a submit button |
| `rows` | number | `1` | Lines the field takes |
| `optional` | boolean | `false` | Adds `(optional)` to the label |
| `required` | boolean | `false` | Adds `*` to the label |
| `error` | string | none | Drawn under the field in the error colour |
| `autoFocus` | boolean | none | Takes the focus when drawn |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | The engine's field | The engine's field | The label and the value, read only: the mobile app draws no field yet |

## Source of truth

- Dash0's web Input. The copy rules are FIELD-001 to FIELD-004 and ERROR-003 in Dash0's content guidelines.
