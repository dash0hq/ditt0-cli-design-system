# Ditt0 for Go

Ditt0 for terminal programs outside Claude Code: the same colours, and the same components where Ditt0 has them, for anything that writes to a terminal in Go. It's Ditt0's first target beyond Claude Code mods. The `dash0 k8s pods watch` page in the [dash0 CLI](https://github.com/dash0hq/dash0-cli) draws in this style.

| Here | Ditt0 in Claude Code | What it draws |
| --- | --- | --- |
| `Theme`, `Dark`, `Light`, `FromEnv` | [Colors](../components/foundations/tokens/tokens.md) | Status colours, badge fills, the chart palette and a selected toggle's border, by theme |
| `Theme.ManagedSeriesColor` | [Color Manager](../components/foundations/color-manager/color-manager.md) | The colour Dash0 gives a chart's i-th series. Timeseries uses it for series with no colour |
| `FormatValue` | [Units](../components/foundations/units/units.md) | A value with its unit: `94.7 GB`, `7.97 cores`, `12.5K`; the short names (`ms`, `B`, `%`), `ratio`, `milliseconds`, `bytes/s` and `decimal` too |
| `Timeseries` | [Timeseries](../components/molecules/charts/timeseries/timeseries.md) | Box-drawing lines, or with `LineType: ditt0.LineTypeBraille` one thin line of braille dots (Dots); round y axis, time axis, legend; small multiples for four series or more, or when one would flatten. `Times` on the local clock, or `Labels` and `TimeLabel` written as given, as the JS `times` and `timeLabel` |
| `Stat`, `Threshold` | [Stat](../components/molecules/charts/stat/stat.md) | The number in big digits, its change against `Previous`, and a sparkline; `Thresholds` colour it |
| `Sparkline` | Stat's sparkline | A row of eighths |
| `Button`, `ChartControls`, `LiveRanges` | [Button](../components/atoms/button/button.md), [ChartControls](../components/molecules/chart-controls/chart-controls.md) | A rounded button; a chart's time ranges as toggles, the selected one in the accent colour |
| `Run`, `PaneProps`, `Frame`, `Hints` | [Pane](../components/templates/pane/pane.md) | A page that fills the terminal: scrolls under a dim footer of key hints, switches ranges on 1 to 4, refreshes |
| `Box`, `Row`, `Column`, `Block` | [Box](../components/atoms/box/box.md) | Rows and columns with gaps, padding and Ditt0's dim rounded border; `Block` is lines of styled cells, cut to the terminal's width, written with ANSI colours and OSC 8 links |

## Install

The repository is private, so tell Go not to look it up in the public proxy:

```bash
go env -w GOPRIVATE=github.com/dash0hq/*
go get github.com/dash0hq/ditt0-cli-design-system/go
```

## Use it

```go
import (
	"fmt"
	"os"

	"github.com/dash0hq/ditt0-cli-design-system/go/ditt0"
)

t := ditt0.FromEnv() // DITT0_THEME=light draws the light set, anything else dark

chart := ditt0.Timeseries(ditt0.TimeseriesProps{
	Series: []ditt0.Series{
		{Name: "usage", Values: usage}, // no Color: the colour Dash0's colour manager gives series 0
		{Name: "request", Values: request},
	},
	Times: times, Unit: "cores", Width: 60, Rows: 8, Theme: t,
	OneAxis: true, // usage against its request is the point, so keep one axis
	// LineType: ditt0.LineTypeBraille, // thin braille lines in place of box-drawing ones
})
stat := ditt0.Stat(ditt0.StatProps{Label: "Errors", Values: errors, Unit: "/s", GoodWhen: "down", Previous: errors[0], CompareLabel: "vs start"}, t)

card := ditt0.Box(ditt0.BoxProps{Direction: "row", Gap: 4, Padding: 1, Border: true}, chart, stat)
fmt.Println(card.Cut(width).ANSI()) // cut to the terminal's width, so it never wraps
```

## A live page

`Run` draws a page that fills the terminal and answers keys, as Ditt0's panes do in Claude Code. It only draws and reads keys: your program keeps the data. Every Go program that runs it takes the same keys.

```go
err := ditt0.Run(ditt0.PaneProps{
	Range: 1, // LiveRanges[1], 1h
	Draw: func(width, height int, r ditt0.Range) ditt0.Block {
		return ditt0.Column(1, ditt0.ChartControls(ditt0.ChartControlsProps{Range: r.Value}, t), charts(r, width))
	},
	// In the background; Run draws again when it returns. ctx is cancelled when the range changes or the page quits
	Fetch: func(ctx context.Context, r ditt0.Range, width, height int) { load(ctx, r) },
	Keys:  []ditt0.Key{{Key: "o", Label: "open in Dash0", Do: open}},
	Quit:  "back to k9s",
})
```

| Key | Does |
| --- | --- |
| `↑` `↓`, `j` `k` | Scroll a row |
| `PgUp` `PgDn`, `b` `Space` | Scroll a page |
| `Home` `End`, `g` `G` | Top, bottom |
| `1` to `4` | The range, from `Ranges` (`LiveRanges` when nil: 15m, 1h, 6h, 24h) |
| `r` | Fetch now. `Fetch` also runs every `Refresh` (30 s) |
| `q`, `Esc`, `Ctrl-C` | Quit |

`OnRange` runs as soon as a range is picked, before `Fetch`: clear the old range's data there, so the page starts empty. `Once` fetches, prints the page and returns, for a `--once` flag.

`Fetch` gets a `context.Context` that is cancelled when the range changes or the page quits. Pass it to your requests and store nothing once `ctx.Err()` is set, so a slow answer for the old range never shows under the new one's label.

`Run`'s own keys win over the page's `Keys`, so don't give a page key one of the keys above. An escape sequence `Run` doesn't know (Shift-Tab, say) does nothing. A blocked read of stdin can't be called off, so `Run` must be the program's last reader of stdin. A panic in `Fetch` restores the terminal first, then panics again from `Run`.

The footer lists the page's own `Keys` first, then the ones above. It runs on the alternate screen, so the terminal comes back as it was. Piped, with no terminal on stdin, `Run` fetches once, prints the page and returns. `Draw` and `Fetch` run at the same time: guard what they share with a mutex.

Try it: `go run ./examples/pod`, the k9s pod page with sample data.

`DITT0_THEME` is the convention for every Ditt0 program outside Claude Code, so one export sets them all.

Values are `[]*float64`, oldest first: `nil` is a gap, never a zero. `Block.String()` gives the text with no colour, for tests.

## Terminals

The charts draw with box-drawing and block characters (`─ │ ╭ ▁ █`), so they need a terminal that draws those itself, filling each cell edge to edge: iTerm2, Ghostty, WezTerm, kitty or Orca. macOS Terminal takes them from the font and leaves gaps between rows. Colours are 24-bit.

## One base

Go and the JS components are two libraries on one base, so they never drift apart:

- **Tokens.** `tokens_gen.go` is generated from [tokens.js](../components/foundations/tokens/tokens.js), which copies Dash0's design system. Change a colour there, never here.
- **Constants.** `constants_gen.go` holds the fixed values both draw with: Timeseries' rows, line glyphs and round steps ([timeseries.constants.js](../components/molecules/charts/timeseries/timeseries.constants.js)), Stat's big digits, eighths and sparkline width ([stat.constants.js](../components/molecules/charts/stat/stat.constants.js)), Legend's name length and gap ([legend.constants.js](../components/atoms/legend/legend.constants.js)), and the unit steps and short names ([units.js](../components/foundations/units/units.js)). Change them there.
- **Goldens.** The drawing itself follows the JS components function by function, and is pinned by goldens: `testdata/goldens/` holds what the JS components draw for a fixed set of cases (Timeseries with gaps, folded and stretched columns, small multiples, one axis, bytes, cores, seconds, percent; Stat up, down, with no data, decimals, a threshold; Sparkline; ChartControls; Button), each as plain text (`<name>.txt`) and each row's colours, bold and dim (`<name>.style`). `TestGoldens` draws the same cases (`cases.json`) and must match both byte for byte. Where Go differs, the JS drawing is right: fix Go.

To regenerate, from the repository root:

```bash
node scripts/export-tokens.mjs    # tokens_gen.go, constants_gen.go, tokens.json
node scripts/export-goldens.mjs   # testdata/goldens/, from tests/goldens/cases.js (needs bun, to bundle the JSX)
```

Add a golden case in [tests/goldens/cases.js](../tests/goldens/cases.js), never by editing a golden. What is checked:

- `node scripts/export-tokens.mjs --check` and `node scripts/export-goldens.mjs --check` fail while a generated file is out of date.
- `claude plugin test .` runs the goldens check too ([tests/goldens.test.ts](../tests/goldens.test.ts)): a change to a JS component that moves its drawing fails there until the goldens are written again.
- `go test ./...` fails while Go draws a case differently from the goldens.

Go covers Ditt0's charts (Timeseries in its Lines and Dots looks, Stat, Sparkline), Button, ChartControls' ranges, Box and Pane, by design: what a terminal program outside Claude Code needs. The rest of Ditt0 (bars, hover cards, zoom, tables, forms) stays in Claude Code.

## Develop

```bash
cd go
go vet ./...
go test ./...
```

