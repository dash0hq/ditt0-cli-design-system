# Badge

A short label that marks a state or a count: Critical, 3 errors, Beta.

Storybook: `Components/Feedback/Badge` · Stories: `components-feedback-badge--*`

## When not to use it

- **A sentence about a state:** use [Text](../text/text.md) with a status colour.
- **Something to press:** use [Button](../button/button.md). A badge does nothing when pressed.

## Quick start

```jsx
import { Badge } from '../components/badge/badge.jsx'

<Badge label="Critical" color="critical" />
```

## Variants

**Default.** Use it when the label is information without a state, such as Beta.

**Critical.** Use it when something has failed and needs someone now: a failed check, an error rate over its threshold.

**Attention.** Use it when something is degraded but still works.

**Success.** Use it when a check passes and that is worth saying, such as after a fix.

**Severe.** Use it for a count of errors or warnings that is not a failure yet.

**Primary.** Use it for something new or featured.

**Subtle.** Use it when many badges sit together, such as one per row of a list. It draws the label in the colour without the fill, so the rows stay quiet.

```jsx
<Badge label="Critical" color="critical" subtle />
```

## Do and don't

**Do** keep the label to one or two words. A badge is read at a glance.

**Don't** use colour as the only signal. Write the state in the label ("Critical", not "!") so people who can't tell the colours apart still read it.

**Do** use the colour that matches Dash0's check status: failed is critical, degraded is attention.

**Don't** use critical to draw attention to something that hasn't failed. People learn to ignore it.

## Accessibility

- The label is the whole message. The colour repeats it, never replaces it.
- Each fill comes with its own ink colour, so the label keeps its contrast in both themes.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | string | required | The text in the badge |
| `color` | `'default' \| 'critical' \| 'attention' \| 'success' \| 'severe' \| 'primary'` | `'default'` | The state it marks |
| `subtle` | boolean | `false` | The colour as text, without the fill |

## Surfaces

The same on every surface: a coloured run of text with a space either side.

## Source of truth

- Colours: Dash0's web Badge, through [tokens.js](../../foundations/tokens/tokens.js).
- Ink on each fill: the matching status' text colour in Dash0's semantic colour tokens. Severe has no status of its own and borrows warning's dark ink. That choice is ours, not Dash0's.
- Left out: `size` (a terminal row has one height), and the `-secondary` colours.
