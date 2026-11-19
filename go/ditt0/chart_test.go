package ditt0

import (
	"fmt"
	"strings"
	"testing"
	"time"
)

func f(v float64) *float64 { return &v }

func TestFormatValue(t *testing.T) {
	cases := []struct {
		v    float64
		unit string
		want string
	}{
		{94711762944, "bytes", "94.7 GB"},
		{850, "bytes", "850 B"},
		{7.966, "cores", "7.97 cores"},
		{1128, "", "1128"},
		{12500, "", "12.5K"},
	}
	for _, c := range cases {
		if got := FormatValue(f(c.v), c.unit); got != c.want {
			t.Errorf("FormatValue(%v, %q) = %q, want %q", c.v, c.unit, got, c.want)
		}
	}
	if got := FormatValue(nil, "bytes"); got != "no data" {
		t.Errorf("nil reads %q", got)
	}
}

func TestNice(t *testing.T) {
	cases := []struct{ in, want span }{
		{span{6.7, 36}, span{0, 40}},
		{span{77e9, 146e9}, span{60e9, 160e9}},
		{span{99, 102}, span{99, 103}},
	}
	for _, c := range cases {
		if got := nice(c.in); got != c.want {
			t.Errorf("nice(%v) = %v, want %v", c.in, got, c.want)
		}
	}
}

func minutes(n int) []time.Time {
	start := time.Date(2026, 11, 11, 18, 0, 0, 0, time.UTC)
	out := make([]time.Time, n)
	for i := range out {
		out[i] = start.Add(time.Duration(i) * time.Minute)
	}
	return out
}

func TestTimeseriesDrawsAxisAndLegend(t *testing.T) {
	out := Timeseries(TimeseriesProps{
		Series: []Series{{"usage", []*float64{f(1), f(2), f(3)}, "#828aff"}},
		Times:  minutes(3), Unit: "cores", Width: 40, Rows: 5,
	}).String()
	for _, want := range []string{"cores", "┤", "└┬", "━ usage", "┄"} {
		if !strings.Contains(out, want) {
			t.Errorf("chart lacks %q:\n%s", want, out)
		}
	}
	empty := Timeseries(TimeseriesProps{Series: []Series{{"usage", nil, "#828aff"}}, Width: 40, Rows: 5})
	if !strings.Contains(empty.String(), "No data") {
		t.Errorf("an empty series says so")
	}
}

func TestTimeseriesSplitsSeriesThatWouldFlatten(t *testing.T) {
	big := []*float64{f(30000), f(31000), f(29000), f(30500)}
	small := []*float64{f(900), f(950), f(880), f(910)}
	ss := []Series{{"UNKNOWN", big, Dark.ManagedSeriesColor(0)}, {"ERROR", small, Dark.Error.Inline}}
	split := Timeseries(TimeseriesProps{Series: ss, Times: minutes(4), Width: 50, Rows: 7}).String()
	if !strings.Contains(split, "━ ERROR") || strings.Count(split, "└") != 1 {
		t.Errorf("series that flatten draw as small multiples over one time axis:\n%s", split)
	}
	shared := Timeseries(TimeseriesProps{Series: ss, Times: minutes(4), Width: 50, Rows: 7, OneAxis: true}).String()
	if strings.Contains(shared, "━ ERROR\n") || !strings.Contains(shared, "━ UNKNOWN  ━ ERROR") {
		t.Errorf("OneAxis keeps one panel and a shared legend:\n%s", shared)
	}
}

func TestStatShowsChangeInTheGoodDirection(t *testing.T) {
	rising := []*float64{f(100), f(110), f(120)}
	up := Stat(StatProps{Label: "Requests", Values: rising, Unit: "/s", Previous: f(100), CompareLabel: "vs 1h ago"}, Dark)
	down := Stat(StatProps{Label: "Latency", Values: rising, Unit: "seconds", Previous: f(100), GoodWhen: "down"}, Dark)
	arrow := func(b Block) Segment {
		for _, l := range b {
			if len(l) > 0 && strings.HasPrefix(l[0].Text, "▲") {
				return l[0]
			}
		}
		t.Fatalf("no ▲ in:\n%s", b)
		return Segment{}
	}
	if got := arrow(up); got.Text != "▲ 20%" || got.Style.Fg != Dark.Healthy.Inline {
		t.Errorf("a rising request rate is good: %+v", got)
	}
	if got := arrow(down); got.Style.Fg != Dark.Error.Inline {
		t.Errorf("a rising latency is bad: %+v", got)
	}
	if !strings.Contains(up.String(), "╺━┓") {
		t.Errorf("the number draws in big digits:\n%s", up)
	}
}

func TestSparklineKeepsGapsAndFlatLines(t *testing.T) {
	if got := Sparkline([]*float64{f(1), nil, f(3)}, 10); got != "▁ █" {
		t.Errorf("Sparkline = %q", got)
	}
	if got := Sparkline([]*float64{f(5), f(5)}, 10); got != "▄▄" {
		t.Errorf("a flat line sits mid-height: %q", got)
	}
}

func TestBlockANSIColoursSegments(t *testing.T) {
	got := Block{Text("hi", Style{Fg: "#828aff", Bold: true})}.ANSI()
	if got != "\x1b[1;38;2;130;138;255mhi\x1b[0m" {
		t.Errorf("ANSI = %q", got)
	}
}

func TestSeriesWithoutColourTakeTheColourManagersOrder(t *testing.T) {
	out := Timeseries(TimeseriesProps{
		Series: []Series{{Name: "a", Values: []*float64{f(1), f(2)}}, {Name: "b", Values: []*float64{f(2), f(1)}}, {Name: "c", Values: []*float64{f(1), f(1)}}},
		Times:  minutes(2), Width: 30, Rows: 5, OneAxis: true, Theme: Light,
	})
	var legend []string
	for _, l := range out {
		for _, s := range l {
			if s.Text == "━" {
				legend = append(legend, s.Style.Fg)
			}
		}
	}
	want := []string{Light.ManagedSeriesColor(0), Light.ManagedSeriesColor(1), Light.ManagedSeriesColor(2)}
	if strings.Join(legend, ",") != strings.Join(want, ",") {
		t.Errorf("legend colours %v, want %v", legend, want)
	}
}

func TestBoxDrawsDitt0sDimRoundedBorder(t *testing.T) {
	got := Box(BoxProps{Direction: "row", Gap: 1, Border: true}, Block{Text("a", Style{})}, Block{Text("b", Style{})}).String()
	want := "╭─────╮\n│ a b │\n╰─────╯"
	if got != want {
		t.Errorf("Box =\n%s\nwant\n%s", got, want)
	}
}

func TestFromEnvReadsDitt0Theme(t *testing.T) {
	t.Setenv("DITT0_THEME", "light")
	if FromEnv().Name != "light" {
		t.Error("DITT0_THEME=light draws light")
	}
	t.Setenv("DITT0_THEME", "")
	if FromEnv().Name != "dark" {
		t.Error("no DITT0_THEME draws dark")
	}
}

func TestBlockCutKeepsNarrowTerminalsFromWrapping(t *testing.T) {
	if got := (Block{Text("abcdef", Style{})}).Cut(3).String(); got != "abc" {
		t.Errorf("Cut = %q", got)
	}
}

// A pane can be any size, a few cells or none (k9s hands a plugin whatever it has): nothing may panic
func TestTinySizesNeverPanic(t *testing.T) {
	v := func(x float64) *float64 { return &x }
	values := []*float64{v(0.1), v(0.2), nil, v(0.4)}
	start := time.Unix(1_800_000_000, 0)
	times := []time.Time{start, start.Add(time.Minute), start.Add(2 * time.Minute), start.Add(3 * time.Minute)}
	for w := -4; w <= 12; w++ {
		for _, lt := range []LineType{LineTypeBox, LineTypeBraille} {
			for _, rows := range []int{0, 1, 2, 5} {
				chart := Timeseries(TimeseriesProps{Series: []Series{{Name: "a", Values: values}, {Name: "b", Values: values}}, Times: times, Unit: "cores", Width: w, Rows: rows, LineType: lt})
				card := Border(Column(1, Block{Text("CPU", Style{Bold: true})}, chart), w, 1, DimStyle)
				_ = Indent(w, Row(w, card, Stat(StatProps{Label: "CPU", Values: values, Unit: "cores"}, Dark))).Cut(w).ANSI()
				_ = Box(BoxProps{Direction: "row", Gap: w, Padding: 1, Border: true}, card).Cut(w).String()
			}
		}
	}
}

func TestANSIJoinsNeighboursOfOneStyle(t *testing.T) {
	red, blue := Style{Fg: "#ff0000"}, Style{Fg: "#0000ff"}
	l := Line{{Text: "a", Style: red}, {Text: "b", Style: red}, {Text: "", Style: blue}, {Text: "c", Style: red}, {Text: "d", Style: blue}, {Text: "e"}, {Text: "f"}}
	want := "\x1b[38;2;255;0;0mabc\x1b[0m\x1b[38;2;0;0;255md\x1b[0mef"
	if got := l.ANSI(); got != want {
		t.Fatalf("ANSI() = %q, want %q", got, want)
	}
	if len(l) != 7 || l[0].Text != "a" {
		t.Fatalf("ANSI changed the line it was called on: %v", l)
	}
}

// Rows on small multiples is the panels' height together, split evenly, the remainder to the first panels
func TestTimeseriesRowsSplitsBetweenMultiples(t *testing.T) {
	ss := []Series{
		{"requests", []*float64{f(1200), f(1300), f(1250), f(1210)}, ""},
		{"errors", []*float64{f(1), f(3), f(2), f(1)}, ""},
		{"rejected", []*float64{f(0.01), f(0.03), f(0.02), f(0.05)}, ""},
		{"retried", []*float64{f(40), f(41), f(40), f(42)}, ""},
	}
	plotRows := func(rows int) []int {
		var heights []int
		for _, s := range strings.Split(Timeseries(TimeseriesProps{Series: ss, Times: minutes(4), Width: 40, Rows: rows}).String(), "\n") {
			switch {
			case strings.Contains(s, "━ "):
				heights = append(heights, 0)
			case strings.Contains(s, "┤") || strings.Contains(s, "│"):
				heights[len(heights)-1]++
			}
		}
		return heights
	}
	for _, c := range []struct {
		rows int
		want []int
	}{{0, []int{5, 5, 5, 5}}, {20, []int{5, 5, 5, 5}}, {22, []int{6, 6, 5, 5}}, {4, []int{3, 3, 3, 3}}} {
		if got := plotRows(c.rows); fmt.Sprint(got) != fmt.Sprint(c.want) {
			t.Errorf("Rows %d: panels %v rows high, want %v", c.rows, got, c.want)
		}
	}
}

func TestTimeseriesLeavesOutAnEmptyLegend(t *testing.T) {
	vs := []*float64{f(1), f(3), f(2), f(4)}
	unnamed := Timeseries(TimeseriesProps{Series: []Series{{"", vs, Dark.Error.Inline}}, Times: minutes(4), Width: 50, Rows: 5})
	if last := (Block{unnamed[len(unnamed)-1]}).String(); strings.Contains(last, "━") {
		t.Errorf("a series with no name has no legend, got last line %q", last)
	}
	named := Timeseries(TimeseriesProps{Series: []Series{{"errors", vs, Dark.Error.Inline}}, Times: minutes(4), Width: 50, Rows: 5}).String()
	if !strings.Contains(named, "━ errors") {
		t.Errorf("a named series keeps its legend:\n%s", named)
	}
}
