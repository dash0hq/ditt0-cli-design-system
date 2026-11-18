package ditt0

import "time"

// Ditt0's Button (components/atoms/button) and ChartControls' time ranges (components/molecules/chart-controls), for
// a page that takes keys. They only draw: the page keeps which range is on and draws again when it changes, as
// Run does.

// ButtonProps are Button's props. Toggle makes it one of a row of toggles, such as a chart's ranges: Selected is the
// one that is on, its border in the accent colour; the others draw dim. Without Toggle it is an action, its border
// the button stroke.
type ButtonProps struct {
	Label            string
	Toggle, Selected bool
}

// Button is Ditt0's default Button: its label in a rounded border, three rows high, so it reads as a control.
func Button(p ButtonProps, t Theme) Block {
	edge, label := Style{Fg: t.ButtonStroke}, Style{}
	if p.Toggle && p.Selected {
		edge = Style{Fg: t.Selected}
	} else if p.Toggle {
		// The button stroke, dimmed, as the JS Button's borderDimColor draws it
		edge, label = Style{Fg: t.ButtonStroke, Dim: true}, DimStyle
	}
	b := Block{Text(p.Label, label)}
	return Border(b, b.Width()+4, 1, edge)
}

// Range is a time range a page offers: Value names it, Label is what its toggle says.
type Range struct {
	Value, Label string
	Duration     time.Duration
}

// LiveRanges are the ranges Ditt0's live pages offer, on keys 1 to 4.
var LiveRanges = []Range{
	{"15m", "15m", 15 * time.Minute},
	{"1h", "1h", time.Hour},
	{"6h", "6h", 6 * time.Hour},
	{"24h", "24h", 24 * time.Hour},
}

// ChartControlsProps are ChartControls' props, as the JS ChartControls names them: the ranges offered (LiveRanges
// when nil, none when empty) and the selected range's Value.
type ChartControlsProps struct {
	Ranges []Range
	Range  string
}

// ChartControls is the line of controls over a chart: its time ranges as a row of toggles, the selected one in the
// accent colour.
func ChartControls(p ChartControlsProps, t Theme) Block {
	ranges := p.Ranges
	if ranges == nil {
		ranges = LiveRanges
	}
	toggles := make([]Block, len(ranges))
	for i, r := range ranges {
		toggles[i] = Button(ButtonProps{Label: r.Label, Toggle: true, Selected: r.Value == p.Range}, t)
	}
	return Row(0, toggles...)
}
