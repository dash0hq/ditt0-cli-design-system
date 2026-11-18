# Heading

A page's title, large, and a section's heading.

Storybook: `Components/Typography/Heading` · Stories: `components-typography-heading--*`

## When not to use it

- **Body text, labels, values:** use [Text](../text/text.md).
- **A card's title:** ChartCard and the status views draw their own, as intense Text.

## Quick start

```jsx
import { Heading } from '../components/atoms/heading/heading.jsx'

<Heading level="h2">Services overview</Heading>
<Heading level="heading">Failed checks</Heading>
```

## Variants

**Levels.** The terminal has one text size, so a title draws large there in a pixel font (`font.js`), after Chicago, the first Macintosh's system font, with upper and lower case. Three sizes, each smaller than the one above it. A title too wide for `maxWidth` (72 cells) puts its next word on a line of its own. A surface with type sizes draws each bold at its size.

- `h1` (or `title`): capitals nine pixels tall, stems two pixels wide, six lines. For a splash, once in a pane at most.
- `h2`: capitals six pixels tall, four lines. A page's title, such as the gallery's component pages.
- `h3`: capitals five pixels tall, three lines. A title inside a page, over a group of sections.

<Canvas story="components-typography-heading--h1" />

<Canvas story="components-typography-heading--h2" />

<Canvas story="components-typography-heading--h3" />

**Long.** Two words wider than `maxWidth` together: the second goes under the first, a blank line between.

<Canvas story="components-typography-heading--long" />

**Heading.** Bold, over a section of a page.

<Canvas story="components-typography-heading--section" />

**Colored.** Any hex or theme colour, for a brand title such as Ditt0's.

<Canvas story="components-typography-heading--colored" />

## Do and don't

**Do** keep a title short: one to three words. `Services` is 48 cells wide in h1, 37 in h2 and 29 in h3, so `Services Overview` (105, 81, 64) takes two lines of words in h1 and h2, one in h3.

**Do** pick the smallest level that does the job: h2 for a page's title.

**Don't** draw a pixel title in a narrow card. A word wider than its line cuts at the edge.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `children` | string | required | The text |
| `level` | `'h1'`, `'h2'`, `'h3'`, `'heading'`, `'title'` | `'title'` | A pixel size (h1 six lines, h2 four, h3 three), or bold text; `title` is h1 |
| `color` | hex or theme colour | the theme's text | Its colour |
| `maxWidth` | number | `72` | Cells a title's line may take in the terminal; the words past it go onto the next line |

## Surfaces

| | Terminal | Desktop | Mobile |
| --- | --- | --- | --- |
| h1, h2 | Pixel font, 6 or 4 lines a line of words | `size="title"`, bold | `size="title"`, bold |
| h3 | Pixel font, 3 lines a line of words | `size="heading"`, bold | `size="heading"`, bold |
| Heading | Bold | `size="heading"`, bold | `size="heading"`, bold |

## Source of truth

- Type sizes: Claude Code's Text `size` scale. The pixel font is this library's own: Dash0's web type scale has no terminal equivalent yet (see [tokens](../../foundations/tokens/tokens.md)).
