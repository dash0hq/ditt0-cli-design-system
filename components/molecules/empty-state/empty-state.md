# EmptyState

What a view shows when it has nothing to show, centred where the content would be.

Storybook: `Components/Feedback/EmptyState` · Stories: `components-feedback-emptystate--*`

## When not to use it

- **A message about a view that does have data:** use [Banner](../banner/banner.md).

## Quick start

```jsx
import { EmptyState } from '../components/molecules/empty-state/empty-state.jsx'

<EmptyState variant="no-results" title="No logs match these filters" body="Remove a filter or widen the time range." action={{ label: 'Clear filters', id: 'clear-filters', onClick: clear }} />
```

## Variants

Four kinds of nothing, each with its own glyph. Pick by why the view is empty, because each needs different copy.

**No results** (`∅`, the default). Data exists, but none matches the filter or query. The action clears or widens it.

<Canvas story="components-feedback-emptystate--default" />

**First time** (`◇`, purple). Nothing has been sent yet. This is EMPTY-001's pattern A:

- No title.
- Two sentences: what the view shows, then what a person can do with it (EMPTY-002).
- The CTA **Send telemetry to Dash0**, filled purple.
- The links **View [feature] in OpenTelemetry Demo** and **Get help with setup**.

<Canvas story="components-feedback-emptystate--first-time" />

**Done** (`✓`, green). Nothing is left to do. Say so briefly and point forward (EMPTY-006): "All caught up. Check back later for updates."

<Canvas story="components-feedback-emptystate--done" />

**Load error** (`✖`, red). The data didn't load. Show an error with a way to recover, never the first-time state (ERROR-004).

<Canvas story="components-feedback-emptystate--load-error" />

## Do and don't

**Do** end body sentences with a period, even short ones (EMPTY-005).

**Don't** repeat the title in the body (EMPTY-007). "No dashboards yet" followed by "You haven't created any dashboards yet." says nothing new.

**Don't** write "No data available." Say what is missing and what to do.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'no-results'` \| `'first-time'` \| `'done'` \| `'error'` | `'no-results'` | Why it is empty: the glyph, colour and CTA style |
| `title` | string | none | The headline, bold; none for first time |
| `body` | string | none | Full sentences, dim |
| `action` | `{ label, onClick, id }` | none | A CTA Button for first time, an outline Button otherwise |
| `links` | `[{ label, href }]` | `[]` | Links under the action |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Draws as | Glyph, title, body, action, links, centred | The same | The same |

## Source of truth

- Dash0's content guidelines: EMPTY-001 to EMPTY-007 and ERROR-004. The screenshot carousel of pattern A has no terminal form, so the body carries it.
