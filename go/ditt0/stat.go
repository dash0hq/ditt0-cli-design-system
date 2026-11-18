package ditt0

import (
	"math"
	"regexp"
	"sort"
	"strings"
)

// Ditt0's Stat (components/molecules/charts/stat/stat.jsx): the number in digits three rows tall, its unit on the
// bottom row beside it, ▲ or ▼ against the previous value, and the values as a sparkline under it. The digits, the
// eighths and the sparkline's width are constants_gen.go's, generated from stat.constants.js.

var numberRe = regexp.MustCompile(`^(-?[\d.]+)(.*)$`)

// Sparkline is the values as one row of eighths, each cell the mean of the values it covers, low to high between
// their min and max; a flat line sits at the middle, a gap stays blank.
func Sparkline(values []*float64, width int) string {
	cells := min(width, len(values))
	means := make([]*float64, cells)
	lo, hi := math.Inf(1), math.Inf(-1)
	for i := range means {
		sum, count := 0.0, 0
		for _, v := range values[i*len(values)/cells : (i+1)*len(values)/cells] {
			if v != nil {
				sum, count = sum+*v, count+1
			}
		}
		if count > 0 {
			m := sum / float64(count)
			means[i], lo, hi = &m, math.Min(lo, m), math.Max(hi, m)
		}
	}
	runes := []rune(eighths)
	var sb strings.Builder
	for _, m := range means {
		switch {
		case m == nil:
			sb.WriteRune(' ')
		case hi == lo:
			sb.WriteRune(runes[3])
		default:
			sb.WriteRune(runes[int(jsRound((*m-lo)/(hi-lo)*7))])
		}
	}
	return sb.String()
}

// Threshold is a value from which a stat draws in a status colour (error, warning, healthy, ...).
type Threshold struct {
	Value float64
	Color string
}

// The status a value reaches: the last threshold at or under it
func thresholdOf(v *float64, thresholds []Threshold) string {
	sorted := append([]Threshold{}, thresholds...)
	sort.SliceStable(sorted, func(i, j int) bool { return sorted[i].Value < sorted[j].Value })
	color := ""
	for _, t := range sorted {
		if v != nil && *v >= t.Value {
			color = t.Color
		}
	}
	return color
}

// StatProps are Stat's props, named as Ditt0's JS Stat names them.
type StatProps struct {
	// What the number counts, dim over it; none when empty
	Label string
	// The series, oldest first: the stat is the last value that isn't nil, the sparkline is all of them
	Values []*float64
	// A unit as FormatValue takes it
	Unit string
	// The value to compare with, for ▲ or ▼ and the change; none when nil. CompareLabel names it: "vs 1h ago"
	// ("vs previous" when empty)
	Previous     *float64
	CompareLabel string
	// Which way the change is good, "up" (the default, a request rate) or "down" (a latency, an error rate): green
	// when it goes that way, red when it goes the other
	GoodWhen string
	// The value draws in the status colour of the last threshold it reaches
	Thresholds []Threshold
	// A colour for the value instead, such as Theme.Error.Inline (Go only: the JS Stat takes thresholds)
	Ink string
	// A dim line under the sparkline (Go only)
	Note string
}

// Stat is Ditt0's Stat: the number in digits three rows tall, its unit beside the bottom row, ▲ or ▼ against the
// previous value, and the values as a sparkline under it.
func Stat(p StatProps, t Theme) Block {
	var current *float64
	for i := len(p.Values) - 1; i >= 0; i-- {
		if p.Values[i] != nil {
			current = p.Values[i]
			break
		}
	}
	text := FormatValue(current, p.Unit)
	ink := p.Ink
	if color := thresholdOf(current, p.Thresholds); ink == "" && color != "" {
		ink = t.StatusNamed(color).Inline
	}
	var out Block
	if p.Label != "" {
		out = append(out, Text(p.Label, DimStyle))
	}
	if current != nil {
		// The number in big digits, its unit and magnitude (ms, K) on the bottom row beside it
		m := numberRe.FindStringSubmatch(text)
		number, suffix := m[1], strings.TrimSpace(m[2])
		for row := 0; row < 3; row++ {
			parts := []string{}
			for _, ch := range number {
				parts = append(parts, bigDigits[ch][row])
			}
			l := Line{{strings.Join(parts, " "), Style{Fg: ink, Bold: true}}}
			if row == 2 && suffix != "" {
				l = append(l, Segment{" ", Style{}}, Segment{suffix, Style{Fg: ink, Bold: true}})
			}
			out = append(out, l)
		}
	} else {
		out = append(out, Text(text, Style{Fg: ink, Bold: true, Dim: true}))
	}
	if prev := p.Previous; prev != nil && current != nil && *prev != 0 {
		change := (*current - *prev) / math.Abs(*prev) * 100
		good := change > 0
		if p.GoodWhen == "down" {
			good = change < 0
		}
		arrow, color := "=", ""
		if change != 0 {
			color = t.Error.Inline
			if good {
				color = t.Healthy.Inline
			}
			arrow = "▼"
			if change > 0 {
				arrow = "▲"
			}
		}
		abs := math.Abs(change)
		label := p.CompareLabel
		if label == "" {
			label = "vs previous"
		}
		out = append(out, Line{{arrow + " " + FormatValue(&abs, "percent"), Style{Fg: color}}, {" " + label, DimStyle}})
	}
	if len(p.Values) > 1 {
		out = append(out, Text(Sparkline(p.Values, sparkWidth), Style{Fg: ink, Dim: ink == ""}))
	}
	if p.Note != "" {
		out = append(out, Text(p.Note, DimStyle))
	}
	return out
}
