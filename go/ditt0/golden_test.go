package ditt0

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"
	"unicode/utf8"
)

// The goldens are the JS components' drawing of every case in testdata/goldens/cases.json, written by
// scripts/export-goldens.mjs from tests/goldens/cases.js: each case's plain text (<name>.txt) and each row's runs
// of colour, bold and dim (<name>.style). Go draws the same cases and must match both byte for byte. Where they
// differ, the JS drawing is right: fix Go. Never edit a golden by hand; after a change to a JS component, run
// node scripts/export-goldens.mjs from the repository root.

type goldenCase struct {
	Name  string          `json:"name"`
	Kind  string          `json:"kind"`
	Width int             `json:"width"`
	Props json.RawMessage `json:"props"`
}

type goldenSeries struct {
	Name   string     `json:"name"`
	Color  string     `json:"color"`
	Values []*float64 `json:"values"`
}

type goldenProps struct {
	// Timeseries
	Series    []goldenSeries `json:"series"`
	Times     []string       `json:"times"`
	TimeLabel string         `json:"timeLabel"`
	Unit      string         `json:"unit"`
	Multiples *bool          `json:"multiples"`
	LineType  LineType       `json:"lineType"`
	// Stat, sparkline
	Label        string      `json:"label"`
	Values       []*float64  `json:"values"`
	Previous     *float64    `json:"previous"`
	CompareLabel string      `json:"compareLabel"`
	GoodWhen     string      `json:"goodWhen"`
	Thresholds   []Threshold `json:"thresholds"`
	Width        int         `json:"width"`
	// ChartControls, Button
	Ranges   []Range `json:"ranges"`
	Range    string  `json:"range"`
	Selected *bool   `json:"selected"`
}

func (t *Threshold) UnmarshalJSON(b []byte) error {
	var v struct {
		Value float64 `json:"value"`
		Color string  `json:"color"`
	}
	err := json.Unmarshal(b, &v)
	t.Value, t.Color = v.Value, v.Color
	return err
}

func (r *Range) UnmarshalJSON(b []byte) error {
	var v struct{ Value, Label string }
	err := json.Unmarshal(b, &v)
	r.Value, r.Label = v.Value, v.Label
	return err
}

// One case drawn by Go, as the JS one is drawn in the dark theme
func drawCase(c goldenCase) (Block, error) {
	var p goldenProps
	if err := json.Unmarshal(c.Props, &p); err != nil {
		return nil, err
	}
	switch c.Kind {
	case "timeseries":
		ss := make([]Series, len(p.Series))
		for i, s := range p.Series {
			ss[i] = Series{s.Name, s.Values, s.Color}
		}
		return Timeseries(TimeseriesProps{Series: ss, Labels: p.Times, TimeLabel: p.TimeLabel, Unit: p.Unit, Width: c.Width, OneAxis: p.Multiples != nil && !*p.Multiples, LineType: p.LineType}), nil
	case "stat":
		return Stat(StatProps{Label: p.Label, Values: p.Values, Unit: p.Unit, Previous: p.Previous, CompareLabel: p.CompareLabel, GoodWhen: p.GoodWhen, Thresholds: p.Thresholds}, Dark), nil
	case "sparkline":
		width := p.Width
		if width == 0 {
			width = sparkWidth
		}
		return Block{Text(Sparkline(p.Values, width), Style{})}, nil
	case "controls":
		return ChartControls(ChartControlsProps{Ranges: p.Ranges, Range: p.Range}, Dark), nil
	case "button":
		return Button(ButtonProps{Label: p.Label, Toggle: p.Selected != nil, Selected: p.Selected != nil && *p.Selected}, Dark), nil
	}
	return nil, fmt.Errorf("no kind %q", c.Kind)
}

type goldenCell struct {
	ch    rune
	style Style
}

// The block as the goldens write it: its text, and each row's runs as width:styles (fg, bg, b, d, or - for none),
// blank cells at a row's end cut, as tests/goldens/render.js writes them
func goldenOf(b Block) (text, style string) {
	var texts, styles []string
	for _, l := range b {
		var cells []goldenCell
		for _, s := range l {
			st := Style{Fg: s.Style.Fg, Bg: s.Style.Bg, Bold: s.Style.Bold, Dim: s.Style.Dim}
			for _, r := range s.Text {
				cells = append(cells, goldenCell{r, st})
			}
		}
		for len(cells) > 0 && cells[len(cells)-1].ch == ' ' && cells[len(cells)-1].style.Bg == "" {
			cells = cells[:len(cells)-1]
		}
		var sb strings.Builder
		var runs []string
		for i := 0; i < len(cells); {
			j := i
			for j < len(cells) && cells[j].style == cells[i].style {
				sb.WriteRune(cells[j].ch)
				j++
			}
			st := cells[i].style
			var attrs []string
			if st.Fg != "" {
				attrs = append(attrs, "fg"+st.Fg)
			}
			if st.Bg != "" {
				attrs = append(attrs, "bg"+st.Bg)
			}
			if st.Bold {
				attrs = append(attrs, "b")
			}
			if st.Dim {
				attrs = append(attrs, "d")
			}
			if len(attrs) == 0 {
				attrs = []string{"-"}
			}
			runs = append(runs, fmt.Sprintf("%d:%s", j-i, strings.Join(attrs, ",")))
			i = j
		}
		texts = append(texts, sb.String())
		styles = append(styles, strings.Join(runs, " "))
	}
	return strings.Join(texts, "\n") + "\n", strings.Join(styles, "\n") + "\n"
}

func TestGoldens(t *testing.T) {
	raw, err := os.ReadFile("testdata/goldens/cases.json")
	if err != nil {
		t.Fatal(err)
	}
	var cases []goldenCase
	if err := json.Unmarshal(raw, &cases); err != nil {
		t.Fatal(err)
	}
	if len(cases) == 0 {
		t.Fatal("no golden cases")
	}
	for _, c := range cases {
		t.Run(c.Name, func(t *testing.T) {
			b, err := drawCase(c)
			if err != nil {
				t.Fatal(err)
			}
			text, style := goldenOf(b)
			wantText, err := os.ReadFile("testdata/goldens/" + c.Name + ".txt")
			if err != nil {
				t.Fatal(err)
			}
			wantStyle, err := os.ReadFile("testdata/goldens/" + c.Name + ".style")
			if err != nil {
				t.Fatal(err)
			}
			if text != string(wantText) {
				t.Errorf("text differs from the JS drawing\n%s", diff(string(wantText), text))
			} else if style != string(wantStyle) {
				t.Errorf("styles differ from the JS drawing\n%s", diff(string(wantStyle), style))
			}
		})
	}
}

// The rows that differ, JS (want) over Go (got)
func diff(want, got string) string {
	w, g := strings.Split(want, "\n"), strings.Split(got, "\n")
	var sb strings.Builder
	for i := 0; i < max(len(w), len(g)); i++ {
		var a, b string
		if i < len(w) {
			a = w[i]
		}
		if i < len(g) {
			b = g[i]
		}
		if a != b {
			fmt.Fprintf(&sb, "row %d\n  js: %q (%d cells)\n  go: %q (%d cells)\n", i, a, utf8.RuneCountInString(a), b, utf8.RuneCountInString(b))
		}
	}
	return sb.String()
}
