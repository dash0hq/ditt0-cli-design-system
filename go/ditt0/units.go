package ditt0

import (
	"math"
	"math/big"
	"slices"
	"strconv"
	"strings"
)

// Numbers with their units, as components/foundations/units/units.js writes them: a space between the number and an
// abbreviation (3.2 GB), 3 significant digits and 2 decimals at most, one scale for every value of an axis. The steps
// and aliases are constants_gen.go's, generated from units.js.

type scale struct {
	divide float64
	suffix string
}

func unitID(unit string) string {
	if id, ok := unitAliases[unit]; ok {
		return id
	}
	return unit
}

// Whether values in this unit share one scale wherever they sit together: time, bytes and percent do; a count doesn't
func sharesScale(unit string) bool { return slices.Contains(sharedScaleUnits, unitID(unit)) }

type gapStep struct {
	divide float64
	suffix string
	gap    string
}

func withGap(steps []unitStep, times float64, tail, gap string) []gapStep {
	out := make([]gapStep, len(steps))
	for i, s := range steps {
		out[i] = gapStep{s.divide * times, s.suffix + tail, gap}
	}
	return out
}

// The steps of the units that scale; ok false for any other unit, a count with the unit written after it
func stepsOf(unit string) ([]gapStep, bool) {
	switch unit {
	case "decimal":
		return withGap(countSteps, 1, "", ""), true
	case "bytes":
		return withGap(bytesSteps, 1, "", " "), true
	case "bytes/s":
		return withGap(bytesSteps, 1, "/s", " "), true
	case "seconds":
		return withGap(timeSteps, 1, "", " "), true
	case "milliseconds":
		return withGap(timeSteps, 1e3, "", " "), true
	}
	return nil, false
}

// The scale for values up to max, so every value of one axis shares a unit: a value is written as
// digits(value / divide) + suffix
func scaleFor(name string, max float64) scale {
	unit := unitID(name)
	abs := math.Abs(max)
	switch unit {
	case "percent":
		return scale{1, "%"}
	case "ratio":
		return scale{0.01, "%"}
	}
	steps, known := stepsOf(unit)
	if !known {
		tail := ""
		if unit != "" {
			if strings.HasPrefix(unit, "/") {
				tail = unit
			} else {
				tail = " " + unit
			}
		}
		steps = withGap(countSteps, 1, tail, "")
	}
	// A count takes K from 10,000: 1128 reads 1128, not 1.13K
	from := 10.0
	if known && unit != "decimal" {
		from = 1
	}
	for _, s := range steps {
		if abs >= s.divide*from {
			return scale{s.divide, s.gap + s.suffix}
		}
	}
	last := steps[len(steps)-1]
	return scale{last.divide, last.gap + last.suffix}
}

// toFixed is JavaScript's Number.prototype.toFixed: the exact value of n rounded to fixed decimals, a tie away from
// zero
func toFixed(n float64, fixed int) string {
	neg := n < 0
	exact := new(big.Float).SetFloat64(math.Abs(n)).Text('f', 1100)
	dot := strings.IndexByte(exact, '.')
	whole, frac := exact[:dot], exact[dot+1:]
	keep := []byte(whole + frac[:fixed])
	if frac[fixed] >= '5' {
		i := len(keep) - 1
		for ; i >= 0 && keep[i] == '9'; i-- {
			keep[i] = '0'
		}
		if i < 0 {
			keep = append([]byte{'1'}, keep...)
		} else {
			keep[i]++
		}
	}
	s := string(keep)
	if fixed > 0 {
		s = s[:len(s)-fixed] + "." + s[len(s)-fixed:]
	}
	if neg {
		s = "-" + s
	}
	return s
}

// jsNumber writes a float as JavaScript's String(number) does, for the values charts write: -0 is 0
func jsNumber(f float64) string {
	if f == 0 {
		return "0"
	}
	return strconv.FormatFloat(f, 'f', -1, 64)
}

// 3 significant digits, 2 decimals at most, no trailing zeros: 12.5, 850, 0.85
func digits(n float64) string {
	abs := math.Abs(n)
	fixed := 2
	if abs >= 100 {
		fixed = 0
	} else if abs >= 10 {
		fixed = 1
	}
	f, _ := strconv.ParseFloat(toFixed(n, fixed), 64)
	return jsNumber(f)
}

// FormatValue writes a value with its unit as Ditt0's Units do: decimal, bytes, bytes/s, seconds, milliseconds,
// percent, ratio (and their short names: ms, s, B, By, %), or any text after a count (cores, /s). nil reads "no data".
func FormatValue(v *float64, unit string) string {
	if v == nil || math.IsNaN(*v) {
		return "no data"
	}
	return formatIn(*v, scaleFor(unit, *v))
}

func formatIn(v float64, s scale) string { return digits(v/s.divide) + s.suffix }

// A value's number alone, in a scale: for an axis, whose unit is written once, above it
func formatNumber(v float64, s scale) string { return digits(v / s.divide) }

// The unit's name as a scale writes it, for an axis label
func unitLabel(unit string, max float64) string { return strings.TrimSpace(scaleFor(unit, max).suffix) }

// figures significant figures, so 0.8359 reads 0.84 and 698.51 reads 699 (timeseries.js format)
func precise(v float64, figures int) string {
	if math.Abs(v) >= math.Pow(10, float64(figures)) {
		return strconv.FormatFloat(math.Round(v), 'f', -1, 64)
	}
	f, _ := strconv.ParseFloat(strconv.FormatFloat(v, 'g', figures, 64), 64)
	return strconv.FormatFloat(f, 'f', -1, 64)
}
