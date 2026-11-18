# Tag

A filter or attribute on a view, such as `service.name = api`: a key, an operator and a value on one fill.

Storybook: `Components/Data/Tag` · Stories: `components-data-tag--*`

## When not to use it

- **A state or a count** (Critical, 3 failing, Beta): use [Badge](../badge/badge.md).
- **Picking one of a few options:** use [Select](../select/select.md) or [ChartControls](../../molecules/chart-controls/chart-controls.md)' toggles.

## Quick start

```jsx
import { Tag } from '../components/atoms/tag/tag.jsx'

<Tag label="service.name" value="api" onRemove={() => removeFilter('service.name')} />
```

## Variants

The key and operator are dim, the value at full strength, on level 2's fill (`#414144` dark, `#e4e4e7` light), so the three read as one thing.

<Canvas story="components-data-tag--default" />

**Removable.** `onRemove` adds ✕, keyed `remove-<id>`, which takes the tag off.

<Canvas story="components-data-tag--removable" />

**Operator.** Any operator: `=`, `!=`, `>=`, `=~`.

<Canvas story="components-data-tag--operator" />

**Word.** Without a value, a tag is only its label.

<Canvas story="components-data-tag--word" />

**Filters.** A view's filters, side by side, wrapping when they don't fit.

<Canvas story="components-data-tag--filters" />

## Do and don't

**Do** use the attribute's real key, `service.name`, not a friendly name. The key is what a person types in Dash0's filter bar.

**Don't** use a tag as a status. A tag says what a view is filtered to, and a Badge says how something is.

## Accessibility

- The ✕ is a press of its own, so a tag can be read without being removed.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | string | required | The attribute's key, or the tag's word |
| `value` | string | none | What it matches; none draws the label alone |
| `operator` | string | `=` | Between key and value |
| `onRemove` | `() => void` | none | Adds ✕, which calls it |
| `id` | string | the label | Its address; the ✕ is `remove-<id>` |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | ` key = value ✕ ` on a fill | The same | The same |

## Source of truth

- Dash0's filter bar, whose chips show key, operator and value. The fill is the level 2 stroke (`lvl-2-stroke`), through [tokens.js](../../foundations/tokens/tokens.js) `button().stroke`.
