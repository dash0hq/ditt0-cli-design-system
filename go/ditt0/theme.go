// Package ditt0 is Ditt0's colours and components for terminal programs outside Claude Code, such as the dash0 CLI. The values are
// generated from components/foundations/tokens/tokens.js; change a colour there, never here.
package ditt0

import (
	"os"
	"strings"
)

// Status is a status colour: Bg is the fill, Text the ink drawn on that fill, Inline the colour for text on a plain
// surface.
type Status struct{ Bg, Text, Inline string }

// Badge holds the Badge's fills, which predate the status colours.
type Badge struct{ Success, Critical, Attention, Severe, Primary string }

// Raised is a panel a step lighter than the page.
type Raised struct{ Bg, Stroke string }

// Theme is every Ditt0 colour for one theme, as hex strings.
type Theme struct {
	Name                                               string
	Error, Warning, Info, Healthy, Debug, Unknown, CTA Status
	Badge                                              Badge
	ButtonStroke                                       string
	Raised                                             Raised
	// A selected toggle's border: Claude Code's suggestion colour, which Ditt0's Button draws a selected toggle with
	Selected string
	// Chart series colours in Dash0's default palette order. Dark and light are different orderings, so a
	// series' colour changes with the theme.
	Series      []string
	SeriesUnset string
}

// ForName picks the theme for a theme name such as "light", "light-daltonized" or "dark"; anything not named
// light draws with the dark colours, as Ditt0 does in Claude Code.
func ForName(name string) Theme {
	if strings.Contains(strings.ToLower(name), "light") {
		return Light
	}
	return Dark
}

// FromEnv picks the theme from DITT0_THEME, the convention for every program that draws with Ditt0 outside Claude
// Code: "light" draws the light set, anything else, or nothing, the dark one.
func FromEnv() Theme { return ForName(os.Getenv("DITT0_THEME")) }

// StatusNamed returns the status colour by Ditt0's name (error, warning, info, healthy, debug, unknown, cta),
// unknown for any other name.
func (t Theme) StatusNamed(name string) Status {
	switch name {
	case "error":
		return t.Error
	case "warning":
		return t.Warning
	case "info":
		return t.Info
	case "healthy":
		return t.Healthy
	case "debug":
		return t.Debug
	case "cta":
		return t.CTA
	default:
		return t.Unknown
	}
}

// Severity is a log severity's colour (FATAL, ERROR, WARN, INFO, DEBUG, TRACE), unknown for any other level.
func (t Theme) Severity(level string) Status {
	return t.StatusNamed(severityStatus[strings.ToUpper(level)])
}

// SpanStatus is a span status code's colour (ERROR, OK, UNSET). OK is info, not healthy: Dash0 draws a fine span
// blue.
func (t Theme) SpanStatus(code string) Status {
	return t.StatusNamed(spanStatusStatus[strings.ToUpper(code)])
}

// SeriesColor is the colour of the i-th series, wrapping around the palette.
func (t Theme) SeriesColor(i int) string {
	if i < 0 {
		return t.SeriesUnset
	}
	return t.Series[i%len(t.Series)]
}

// managedOrder is the order Dash0 hands out the auto palette's colours in, by their slot in the palette,
// measured so neighbouring series stay apart. Ditt0's color-manager.js uses the same order.
var managedOrder = []int{0, 1, 7, 4, 8, 6, 2, 3, 5}

// ManagedSeriesColor is the colour Dash0's colour manager gives the i-th series of a chart, wrapping around: the
// colours a chart in Dash0 draws its series in. SeriesColor keeps the palette's own order instead.
func (t Theme) ManagedSeriesColor(i int) string {
	if i < 0 {
		return t.SeriesUnset
	}
	return t.Series[managedOrder[i%len(managedOrder)]]
}
