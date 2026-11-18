# CLAUDE.md

How this library is laid out, and what every component has, is in [components/README.md](components/README.md). Read it first.

## Keep the docs in sync

The `<name>.md` doc pages are what agents read to use a component. A doc that is out of date is a bug.

- Every edit to a component's props, defaults, variants or behaviour updates its `<name>.md` **in the same change**: Quick start, Variants, Do and don't, Props table, Surfaces, Source of truth, whichever the edit touches. Don't finish a task with code and docs out of sync.
- A new prop gets a row in the Props table (type, default, what it does) and, if it changes how the chart looks, a variant with a story and a `<Canvas story="..." />`.
- A new or renamed story updates the `<Canvas>` ids in the doc and the story ids in the tests.
- Update [skills/ditt0-ui/SKILL.md](skills/ditt0-ui/SKILL.md), the guide agents build UIs from, when a component, prop or rule it names changes.
- Check the docs that link to the one you changed (`grep -rn "<name>.md" .`) and fix anything they now get wrong, such as "When not to use it" pointers and the table in [components/README.md](components/README.md).
- Run `claude plugin test .` and `claude plugin validate .` before you call it done. When a change touches tokens.js, a chart, Stat, Button, ChartControls, Legend or `go/`, also run `node scripts/export-tokens.mjs --check`, `node scripts/export-goldens.mjs --check` and `cd go && go vet ./... && go test ./...`: the plugin test only checks the JS half of the goldens. CI runs these too (.github/workflows/go.yml).
- At the end, say which doc files you updated.

## Tokens

`components/foundations/tokens/tokens.js` holds every colour, following Dash0's web design system. Never invent a colour in a component; add it to tokens.js with the Dash0 token it follows.
