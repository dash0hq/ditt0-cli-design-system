package ditt0

import (
	"context"
	"strings"
	"testing"
)

func TestChartControlsMarksTheSelectedRange(t *testing.T) {
	b := ChartControls(ChartControlsProps{Range: "1h"}, Dark)
	if got := strings.Split(b.String(), "\n")[1]; got != "│ 15m ││ 1h ││ 6h ││ 24h │" {
		t.Fatalf("labels row: %q", got)
	}
	// 15m's left edge is dim, 1h's is the selected colour
	if !b[0][0].Style.Dim {
		t.Errorf("15m border not dim: %+v", b[0][0].Style)
	}
	if !strings.Contains(b.String(), "╭────╮") || !hasFg(b[0], Dark.Selected) {
		t.Errorf("1h border not in the selected colour")
	}
	if len(ChartControls(ChartControlsProps{Ranges: []Range{}}, Dark)) != 0 {
		t.Errorf("empty ranges should draw nothing")
	}
}

func hasFg(l Line, fg string) bool {
	for _, s := range l {
		if s.Style.Fg == fg {
			return true
		}
	}
	return false
}

func TestFrameScrollsUnderTheFooter(t *testing.T) {
	var body Block
	for i := 0; i < 10; i++ {
		body = append(body, Text(strings.Repeat("x", 30), Style{}))
	}
	frame, scroll := Frame(body, 99, 20, 5, "q quit")
	if scroll != 6 || len(frame) != 5 {
		t.Fatalf("scroll %d, rows %d", scroll, len(frame))
	}
	if frame[0].Width() != 20 {
		t.Errorf("rows not cut to the width: %d", frame[0].Width())
	}
	if got := frame[4][0].Text; got != " ↑↓ scroll (100%) · " {
		t.Errorf("footer %q", got)
	}
	if _, s := Frame(body[:2], 3, 20, 5, "q quit"); s != 0 {
		t.Errorf("a page that fits should not scroll: %d", s)
	}
}

func TestHints(t *testing.T) {
	p := PaneProps{Fetch: func(context.Context, Range, int, int) {}, Keys: []Key{{Key: "o", Label: "open in Dash0"}}, Quit: "back to k9s"}
	if got := Hints(p); got != "o open in Dash0 · 1-4 range · r refresh · q back to k9s" {
		t.Errorf("%q", got)
	}
	if got := Hints(PaneProps{Ranges: []Range{}}); got != "q quit" {
		t.Errorf("%q", got)
	}
}

func TestRunOnceFetchesThenDrawsOnce(t *testing.T) {
	fetched, drawn := 0, 0
	err := Run(PaneProps{
		Once:  true,
		Range: 3,
		Fetch: func(ctx context.Context, r Range, w, h int) { fetched++ },
		Draw: func(w, h int, r Range) Block {
			drawn++
			if r.Value != "24h" || fetched != 1 {
				t.Errorf("drew %s after %d fetches", r.Value, fetched)
			}
			return Block{Text("page", Style{})}
		},
	})
	if err != nil || fetched != 1 || drawn != 1 {
		t.Fatalf("err %v, fetched %d, drawn %d", err, fetched, drawn)
	}
}

func TestSplitKeys(t *testing.T) {
	for in, want := range map[string][]string{
		"\x1b[A":    {"\x1b[A"},
		"jj":        {"j", "j"},
		"\x1b":      {"\x1b"},
		"\x1b[5~q":  {"\x1b[5~", "q"},
		"\x1b[Z":    {"\x1b[Z"}, // Shift-Tab: one unknown key, not Esc then [Z
		"\x1bOA4":   {"\x1bOA", "4"},
		"\x1b[1;5C": {"\x1b[1;5C"},
	} {
		if got := splitKeys(in); strings.Join(got, "|") != strings.Join(want, "|") {
			t.Errorf("splitKeys(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestKeyStep(t *testing.T) {
	p := PaneProps{Fetch: func(context.Context, Range, int, int) {}, Keys: []Key{{Key: "o"}, {Key: "j"}}}
	cases := []struct {
		key    string
		ranges int
		act    keyAction
		n      int
	}{
		{"q", 4, keyQuit, 0},
		{"\x1b", 4, keyQuit, 0},
		{"\x03", 4, keyQuit, 0},
		{"\x1b[Z", 4, keyNone, 0}, // an unknown sequence does nothing, it doesn't quit
		{"\x1b[A", 4, keyScroll, 9},
		{"j", 4, keyScroll, 11}, // Run's own keys win over the page's
		{"\x1b[6~", 4, keyScroll, 15},
		{"g", 4, keyScroll, 0},
		{"r", 4, keyRefresh, 0},
		{"4", 4, keyRange, 3},
		{"5", 4, keyNone, 0},
		{"2", 1, keyNone, 0}, // one range: nothing to pick
		{"o", 4, keyOwn, 0},
	}
	for _, c := range cases {
		if act, n := keyStep(c.key, 10, 5, c.ranges, p); act != c.act || n != c.n {
			t.Errorf("keyStep(%q, ranges %d) = %v %d, want %v %d", c.key, c.ranges, act, n, c.act, c.n)
		}
	}
	if act, _ := keyStep("r", 0, 5, 4, PaneProps{}); act != keyNone {
		t.Errorf("r with no Fetch should do nothing")
	}
}
