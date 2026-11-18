# Link

Text that opens a page outside Claude Code, such as the same query in Dash0.

Storybook: `Components/Navigation/Link` · Stories: `components-navigation-link--*`

## When not to use it

- **An action inside Claude Code:** use [Button](../button/button.md).

## Quick start

```jsx
import { Link } from '../components/link/link.jsx'

<Link href="https://app.dash0.com/goto/metrics/query-builder?org=acme" label="Open in Dash0" />
```

## Variants

**Default.** The label as the surface draws a link.

**Cta.** `variant="cta"`: the one link a view exists to offer, such as opening a chart drawn from Dash0 in the Dash0 app. Filled in Dash0's CTA purple, its label and `↗` in the CTA ink: ` Open in Dash0 ↗ `. One per view. The label stays `Open in Dash0`; the `↗` (Lucide's `external-link`) says it leaves Claude Code.

<Canvas story="components-navigation-link--cta" />

```jsx
<Link href={result.link} label="Open in Dash0" variant="cta" />
```

## Do and don't

**Do** say where the link goes: "Open in Dash0". People can tell what opens before they click.

**Don't** write the URL as the label. It is long, and it says less than its destination's name.

## Accessibility

- The label is the link's name. Keep it meaningful on its own, without the text around it.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `href` | string | required | Where it goes. Remote surfaces open only `https:` |
| `label` | string | the URL | The text drawn, and the link's name |
| `variant` | `'default' \| 'cta'` | `'default'` | `'cta'`: filled in Dash0's CTA purple, with `↗` |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| Opens | What the terminal opens a link with | The browser | The browser, `https:` only |

## Source of truth

- Dash0's web Link. Its `external` prop doesn't apply: every link here opens outside Claude Code.
- The CTA purple: `cta` in Dash0's semantic colour tokens, through [tokens.js](../../foundations/tokens/tokens.js).
- Copy: `Open in Dash0` follows the content guidelines' ACTION-001 (three words, 13 characters), ACTION-003 (a specific verb), ACTION-007 (no punctuation), CAP-001 and CAP-003 (sentence case, Dash0 as branded).
