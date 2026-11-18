// A pod page as a k9s plugin draws it, with sample data: CPU against its request and limit, memory, and three
// stats, in a Pane that scrolls and switches ranges on 1 to 4. go run ./examples/pod (DITT0_THEME=light for the
// light colours; piped, it prints the page once)
package main

import (
	"fmt"
	"math"
	"time"

	"github.com/dash0hq/ditt0-cli-design-system/go/ditt0"
)

func wave(n int, base, amp, period float64) []*float64 {
	out := make([]*float64, n)
	for i := range out {
		v := base + amp*math.Sin(float64(i)/period) + amp*0.3*math.Sin(float64(i)/2.3)
		out[i] = &v
	}
	return out
}

func flat(n int, v float64) []*float64 {
	out := make([]*float64, n)
	for i := range out {
		out[i] = &v
	}
	return out
}

func main() {
	t := ditt0.FromEnv()
	err := ditt0.Run(ditt0.PaneProps{
		Range: 1,
		Draw: func(width, height int, r ditt0.Range) ditt0.Block {
			return page(t, r)
		},
		Keys: []ditt0.Key{{Key: "o", Label: "open in Dash0", Do: func() {}}},
	})
	if err != nil {
		fmt.Println(err)
	}
}

// The page for a range, sixty samples across it
func page(t ditt0.Theme, r ditt0.Range) ditt0.Block {
	const n = 60
	end := time.Date(2026, 11, 12, 10, 0, 0, 0, time.Local)
	times := make([]time.Time, n)
	for i := range times {
		times[i] = end.Add(-r.Duration + time.Duration(i)*r.Duration/n)
	}
	// A longer range packs more of the waves in
	period := math.Sqrt(r.Duration.Hours())

	cpu := ditt0.Timeseries(ditt0.TimeseriesProps{
		Series: []ditt0.Series{
			{Name: "usage", Values: wave(n, 0.35, 0.12, 6/period)},
			{Name: "request", Values: flat(n, 0.5)},
			{Name: "limit", Values: flat(n, 1)},
		},
		Times: times, Unit: "cores", Width: 58, Rows: 8, Theme: t, OneAxis: true,
	})
	memory := ditt0.Timeseries(ditt0.TimeseriesProps{
		Series: []ditt0.Series{{Name: "working set", Values: wave(n, 690e6, 40e6, 9/period)}},
		Times:  times, Unit: "bytes", Width: 58, Rows: 8, Theme: t,
	})
	// Each stat compared with its first value, the start of the range
	stat := func(p ditt0.StatProps) ditt0.Block {
		p.Previous, p.CompareLabel = p.Values[0], "vs "+r.Label+" ago"
		return ditt0.Stat(p, t)
	}
	requests := stat(ditt0.StatProps{Label: "Requests", Values: wave(n, 120, 20, 7), Unit: "/s"})
	errors := stat(ditt0.StatProps{Label: "Errors", Values: wave(n, 2.4, 1.2, 5), Unit: "/s", GoodWhen: "down", Thresholds: []ditt0.Threshold{{Value: 1, Color: "error"}}})
	p95 := stat(ditt0.StatProps{Label: "Duration p95", Values: wave(n, 0.21, 0.05, 8), Unit: "seconds", GoodWhen: "down"})

	return ditt0.Box(ditt0.BoxProps{Direction: "column", Gap: 1},
		ditt0.ChartControls(ditt0.ChartControlsProps{Range: r.Value}, t),
		ditt0.Box(ditt0.BoxProps{Direction: "row", Gap: 2},
			ditt0.Box(ditt0.BoxProps{Direction: "column", Padding: 1, Border: true}, cpu),
			ditt0.Box(ditt0.BoxProps{Direction: "column", Padding: 1, Border: true}, memory)),
		ditt0.Box(ditt0.BoxProps{Direction: "row", Gap: 6, Padding: 1, Border: true}, requests, errors, p95),
	)
}
