# Banner

A message about a whole view that stays until it no longer applies or is dismissed: a data source that stopped sending, a quota nearly spent.

Storybook: `Components/Feedback/Banner` · Stories: `components-feedback-banner--*`

## When not to use it

- **Confirming something that just happened:** use a toast, `$.ui.toast('Dashboard saved')`, from the hooks module. Per ACTION-011, a toast says what happened in a few words, with no punctuation, no "successfully", and no links.
- **A view with no data at all:** use [EmptyState](../empty-state/empty-state.md).
- **A field's problem:** use [Input](../../atoms/input/input.md)'s `error`.

## Quick start

```jsx
import { Banner } from '../components/molecules/banner/banner.jsx'

<Banner variant="warning" title="You have used 92% of your span quota" description="Spans past the quota are dropped until the 1st of next month." onDismiss={hide} />
```

## Variants

A rounded border and an icon in the status colour, so the meaning never rests on colour alone: info `ℹ`, success `✓`, warning `▲`, error `✖`.

<Canvas story="components-feedback-banner--default" />

**Dismissable.** `onDismiss` adds ✕, keyed `dismiss`.

<Canvas story="components-feedback-banner--warning" />

**With an action.** `action` adds an outline [Button](../../atoms/button/button.md). Write the error as what happened, then what to do (ERROR-001).

<Canvas story="components-feedback-banner--load-error" />

<Canvas story="components-feedback-banner--success" />

**Every variant.**

<Canvas story="components-feedback-banner--variants" />

## Do and don't

**Do** own errors that are Dash0's: "We couldn't load your traces" (ERROR-002).

**Don't** use charged words such as "failed", "invalid" or "error" in the title (ERROR-005).

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'info'` \| `'success'` \| `'warning'` \| `'error'` | `'info'` | The colour and icon |
| `title` | string | required | What happened, short, bold |
| `description` | string | none | Why, and what to do, dim |
| `action` | `{ label, onClick, id }` | none | An outline Button |
| `onDismiss` | `() => void` | none | Adds ✕, keyed `dismiss` |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | A coloured rounded border, icon, title, description | The same | The same |

## Source of truth

- Dash0's web Alert and its toasts. Colours from Dash0's semantic colour tokens (success uses `healthy`) through [tokens.js](../../foundations/tokens/tokens.js). Copy rules: ACTION-011, ERROR-001 to ERROR-006.
