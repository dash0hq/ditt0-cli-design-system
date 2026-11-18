# Tour

A tour of the library that plays itself: the design system, every way a chart draws (dots, lines, bars, grouped and stacked bars, the thinnest bar for a tiny value, zoom), stats, the live pages, plugging in from another mod, generative UI, the framework's layers, and the prior art. Each chart is drawn from real Dash0 data in `fixtures/`.

Level: page · No stories: the tour is its own demo, and its test steps through every slide

## When not to use it

- **To read a component's doc:** use `/book`. The tour shows what the library does; the book says how to use it.

## Quick start

Type `/book-tour` in Claude Code. It steps on every 6 seconds (`STEP_MS`) and stops at the last slide; Previous and Next step by hand, Close or Esc closes it.

## Do and don't

**Do** add a slide when the library gains something worth showing: a `{ title, caption, draw }` in `STEPS`. Draw it from fixtures, never made-up numbers.

**Don't** give a slide controls that do something: the tour draws each control in the state it describes (`ChartControls` with `hotkeys={false}`), so its keys never steal a page's.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `step` | number | `0` | The slide shown, an index into `STEPS` |
| `onPrevious`, `onNext`, `onClose` | `() => void` | none | The foot's Previous, Next and Close |
