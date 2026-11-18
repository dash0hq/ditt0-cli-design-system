package ditt0

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

// Ditt0's Timeseries (components/molecules/charts/timeseries/timeseries.js) in its 'box' and 'braille' line types,
// following toScene and toStrokes function by function: box-drawing strokes a row at a time (draw), or one thin line
// of braille dots (drawBraille), a dim ┄ rule along every
// labelled row, max, middle and min on the y axis between round numbers, the unit once above it, three times under
// it, and a legend of ━ swatches. Its fixed values (rows, glyphs, round steps) are constants_gen.go's, generated
// from timeseries.constants.js. The goldens in testdata/goldens are the JS chart's drawing; Go must match them.

// Series is one line of a chart: its name for the legend, its values oldest first (nil is a gap, never a zero), and
// its colour. With no colour, Timeseries gives it Theme.ManagedSeriesColor of its index.
type Series struct {
	Name   string
	Values []*float64
	Color  string
}

func glyph(sides int) string {
	if g, ok := glyphs[sides&^point]; ok {
		return g
	}
	return loneGlyph
}

// jsRound is JavaScript's Math.round: halves go up
func jsRound(x float64) float64 {
	r := math.Floor(x)
	if x-r >= 0.5 {
		r++
	}
	return r
}

// toPrecision is JavaScript's Number(v.toPrecision(figures)): the exact value of v rounded to figures significant
// figures, a tie away from zero
func toPrecision(v float64, figures int) float64 {
	if v == 0 {
		return 0
	}
	exact := strconv.FormatFloat(math.Abs(v), 'f', 1100, 64)
	dot := strings.IndexByte(exact, '.')
	digits := exact[:dot] + exact[dot+1:]
	first := strings.IndexFunc(digits, func(r rune) bool { return r != '0' })
	e := dot - 1 - first
	sig := []byte(digits[first:min(first+figures, len(digits))])
	for len(sig) < figures {
		sig = append(sig, '0')
	}
	if next := first + figures; next < len(digits) && digits[next] >= '5' {
		i := len(sig) - 1
		for ; i >= 0 && sig[i] == '9'; i-- {
			sig[i] = '0'
		}
		if i < 0 {
			sig, e = append([]byte{'1'}, sig[:len(sig)-1]...), e+1
		} else {
			sig[i]++
		}
	}
	f, _ := strconv.ParseFloat(fmt.Sprintf("%c.%se%d", sig[0], sig[1:], e), 64)
	if v < 0 {
		return -f
	}
	return f
}

// Three significant figures at most (two under 10), so 0.8359 reads 0.84 and 698.51 reads 699; figures for more
// (timeseries.js format; 0 is its default)
func format(v float64, figures int) string {
	if figures == 0 {
		figures = 2
		if math.Abs(v) >= 10 {
			figures = 3
		}
	}
	if math.Abs(v) >= math.Pow(10, float64(figures)) {
		return jsNumber(jsRound(v))
	}
	return jsNumber(toPrecision(v, figures))
}

func parse(s string) float64 {
	f, _ := strconv.ParseFloat(s, 64)
	return f
}

// A column of the chart: the samples it folds, from index to end, their low, high and mean (ok false: a gap). A
// stretched column, between two samples, also has the line's value there (lineOK false beside a gap)
type column struct {
	index, end     int
	min, max, mean float64
	ok             bool
	stretched      bool
	line           float64
	lineOK         bool
}

func (p column) lineOf() (float64, bool) {
	if p.stretched {
		return p.line, p.lineOK
	}
	return p.mean, p.ok
}

// Fold a series into buckets of size samples, each keeping its mean and its low and high; a bucket with no samples
// stays a gap, never a zero
func bucket(values []*float64, size int) []column {
	var points []column
	for i := 0; i < len(values); i += size {
		end := min(i+size, len(values)) - 1
		p := column{index: i, end: end, min: math.Inf(1), max: math.Inf(-1)}
		sum, count := 0.0, 0
		for _, v := range values[i : end+1] {
			if v != nil {
				sum, count = sum+*v, count+1
				p.min, p.max = math.Min(p.min, *v), math.Max(p.max, *v)
			}
		}
		if count > 0 {
			p.mean, p.ok = sum/float64(count), true
		} else {
			p.min, p.max = 0, 0
		}
		points = append(points, p)
	}
	return points
}

type span struct{ min, max float64 }

type sceneSeries struct {
	Series
	points []column
}

// The span a panel's y axis covers; a flat series gets room either side so its line sits mid-panel
func rangeOf(ss []sceneSeries) span {
	lo, hi, any := math.Inf(1), math.Inf(-1), false
	for _, s := range ss {
		for _, p := range s.points {
			if p.ok {
				lo, hi, any = math.Min(lo, p.min), math.Max(hi, p.max), true
			}
		}
	}
	if !any {
		return span{0, 1}
	}
	if lo != hi {
		return span{lo, hi}
	}
	pad := math.Abs(lo) / 2
	if pad == 0 {
		pad = 1
	}
	return span{lo - pad, hi + pad}
}

// Widened to whole steps of 1, 2 or 5 times a power of ten, about four steps apart, as d3's nice() does; a middle
// that wouldn't read round takes one more step at the top
func nice(s span) span {
	raw := (s.max - s.min) / niceStepsPerAxis
	power := math.Pow(10, math.Floor(math.Log10(raw)))
	var step float64
	for _, m := range niceMultiples {
		if m*power >= raw {
			step = m * power
			break
		}
	}
	lo := math.Floor(s.min/step) * step
	hi := math.Ceil(s.max/step) * step
	mid := (lo + hi) / 2
	if math.Abs(parse(format(mid, 0))-mid) > math.Abs(mid)*1e-9 {
		hi += step
	}
	return span{lo, hi}
}

// Whether a series that moves would draw as one flat row on the others' axis, as 600 errors do beside 2.5 million
// spans: it would hide its own changes
func flattens(ss []sceneSeries, rows int) bool {
	all := rangeOf(ss)
	for _, s := range ss {
		lo, hi := math.Inf(1), math.Inf(-1)
		for _, p := range s.points {
			if p.ok {
				lo, hi = math.Min(lo, p.min), math.Max(hi, p.max)
			}
		}
		if hi > lo && hi-lo < (all.max-all.min)/float64(rows-1) {
			return true
		}
	}
	return false
}

// The y labels by row: max, middle and min, with as many figures as it takes to write each exactly, numbers alone
// in the panel's scale
func yLabels(rows int, s span, sc scale) map[int]string {
	values := []float64{s.max, (s.max + s.min) / 2, s.min}
	labels := make([]string, 3)
	for i, v := range values {
		labels[i] = formatNumber(v, sc)
	}
	good := func() bool {
		if labels[0] == labels[1] || labels[1] == labels[2] || labels[0] == labels[2] {
			return false
		}
		for i, v := range values {
			if math.Abs(parse(labels[i])*sc.divide-v) > math.Abs(v)*1e-9 {
				return false
			}
		}
		return true
	}
	for figures := 3; figures <= 6 && !good(); figures++ {
		for i, v := range values {
			labels[i] = format(v/sc.divide, figures)
		}
	}
	return map[int]string{0: labels[0], (rows - 1) / 2: labels[1], rows - 1: labels[2]}
}

// Spread points over more columns than there are samples: every sample a column of its own at its exact value, the
// columns between two samples running straight from one to the next, each showing the sample nearest it; beside a
// gap the line ends at the sample
func stretch(points []column, columns int) []column {
	n := len(points)
	at := make([]int, n)
	for i := range points {
		at[i] = int(jsRound(float64(i*(columns-1)) / float64(n-1)))
	}
	out := make([]column, columns)
	for c := range out {
		i := 0
		for k := n - 1; k >= 0; k-- {
			if at[k] <= c {
				i = k
				break
			}
		}
		p := points[i]
		if at[i] == c || i == n-1 {
			out[c] = p
			continue
		}
		q := points[i+1]
		f := float64(c-at[i]) / float64(at[i+1]-at[i])
		near := q
		if f < 0.5 {
			near = p
		}
		near.stretched = true
		near.lineOK = p.ok && q.ok
		if near.lineOK {
			near.line = p.mean + (q.mean-p.mean)*f
		}
		out[c] = near
	}
	return out
}

type cell struct {
	text  string
	color string
}

// One grid of cells, top row first: a column enters from the left at the previous column's point, runs to its own,
// and leaves right there; a gap on either side cuts the line. Where two series pass through one cell, the one listed
// first keeps it, as if drawn over the other
func draw(ss []sceneSeries, rows int, s span) [][]cell {
	rowOf := func(v float64) int {
		return rows - 1 - int(jsRound((v-s.min)/(s.max-s.min)*float64(rows-1)))
	}
	columns := len(ss[0].points)
	type mark struct {
		sides int
		color string
	}
	marks := make([][]mark, rows)
	for r := range marks {
		marks[r] = make([]mark, columns)
	}
	for _, sr := range ss {
		for c, p := range sr.points {
			v, ok := p.lineOf()
			if !ok {
				continue
			}
			own := rowOf(v)
			entry, hasEntry := 0, false
			if c > 0 {
				if pv, pok := sr.points[c-1].lineOf(); pok {
					entry, hasEntry = rowOf(pv), true
				}
			}
			hasExit := false
			if c < columns-1 {
				_, hasExit = sr.points[c+1].lineOf()
			}
			top, bottom := own, own
			if hasEntry {
				top, bottom = min(own, entry), max(own, entry)
			}
			for r := top; r <= bottom; r++ {
				sides := 0
				if r > top {
					sides |= up
				}
				if r < bottom {
					sides |= down
				}
				if hasEntry && r == entry {
					sides |= left
				}
				if hasExit && r == own {
					sides |= right
				}
				if sides == 0 {
					sides = point
				}
				at := &marks[r][c]
				if at.color != "" && at.color != sr.Color {
					continue
				}
				at.sides |= sides
				at.color = sr.Color
			}
		}
	}
	cells := make([][]cell, rows)
	for r := range marks {
		cells[r] = make([]cell, columns)
		for c, m := range marks[r] {
			if m.sides != 0 {
				cells[r][c] = cell{glyph(m.sides), m.color}
			}
		}
	}
	return cells
}

// Braille: each cell is a 2 × 4 grid of dots, so a line moves a quarter of a row and half a column at a time. Dots by
// their place in the cell, left column then right
var brailleDots = [4][2]rune{{0x01, 0x08}, {0x02, 0x10}, {0x04, 0x20}, {0x40, 0x80}}

// One grid of braille cells, top row first, from the series' raw samples, columns cells wide: always one line, a
// point per dot column, joined to the next by a straight run. A dot column with more than one sample takes their
// mean; with fewer samples than dot columns, each sample is a point at its exact value and the runs between them
// slope. A dot column with only nil samples is a gap: the line stops either side. Where two series meet in a cell,
// the one listed first keeps it, and the other passes behind
func drawBraille(ss []sceneSeries, rows int, s span, columns int) [][]cell {
	width, height := columns*2, rows*4
	// max and min at the middles of the top and bottom rows, where their gridlines and labels are
	yOf := func(v float64) int {
		return max(0, min(height-1, int(jsRound(1.5+(s.max-v)/(s.max-s.min)*float64(height-4)))))
	}
	type mark struct {
		bits  rune
		color string
	}
	marks := make([][]mark, rows)
	for r := range marks {
		marks[r] = make([]mark, columns)
	}
	type dotColumn struct {
		x     int
		sum   float64
		count int
	}
	for _, sr := range ss {
		n := len(sr.Values)
		var points []dotColumn
		for i, v := range sr.Values {
			x := 0
			if n > 1 {
				x = int(jsRound(float64(i*(width-1)) / float64(n-1)))
			}
			if len(points) == 0 || points[len(points)-1].x != x {
				points = append(points, dotColumn{x: x})
			}
			if v != nil {
				points[len(points)-1].sum += *v
				points[len(points)-1].count++
			}
		}
		dot := func(x, y int) {
			if x < 0 || x >= width || y < 0 || y >= height {
				return
			}
			at := &marks[y/4][x/2]
			if at.color != "" && at.color != sr.Color {
				return
			}
			at.bits |= brailleDots[y%4][x%2]
			at.color = sr.Color
		}
		for i, p := range points {
			if p.count == 0 {
				continue
			}
			y := yOf(p.sum / float64(p.count))
			if i == 0 || points[i-1].count == 0 {
				dot(p.x, y)
				continue
			}
			x0, y0 := points[i-1].x, yOf(points[i-1].sum/float64(points[i-1].count))
			steps := max(p.x-x0, max(y-y0, y0-y), 1)
			for k := 0; k <= steps; k++ {
				dot(int(jsRound(float64(x0)+float64((p.x-x0)*k)/float64(steps))), int(jsRound(float64(y0)+float64((y-y0)*k)/float64(steps))))
			}
		}
	}
	cells := make([][]cell, rows)
	for r := range marks {
		cells[r] = make([]cell, columns)
		for c, m := range marks[r] {
			if m.bits != 0 {
				cells[r][c] = cell{string(0x2800 + m.bits), m.color}
			}
		}
	}
	return cells
}

// The ticks' columns: start, middle and end
func ticksOf(points []column) []int {
	return []int{0, (len(points) - 1) / 2, len(points) - 1}
}

// The labels under the ticks: start, middle and end, the end one the last sample's time, ending under its tick. One
// blank cell at least between two labels: one that would touch the label before it is left out
func axisLabels(points []column, times []string) string {
	labels := ""
	for _, col := range ticksOf(points) {
		last := col == len(points)-1
		i := points[col].index
		if last {
			i = points[col].end
		}
		label := "#" + strconv.Itoa(i)
		if i < len(times) {
			label = times[i]
		}
		at := col
		if last {
			at = col + 1 - utf8.RuneCountInString(label)
		}
		if n := utf8.RuneCountInString(labels); n == 0 || n < at {
			labels += strings.Repeat(" ", max(0, at-n)) + label
		}
	}
	return labels
}

// The time labels' row, after the y axis' gutter, the zone dim at its end, or on a row of its own when it can't
func timeRows(points []column, times []string, labelWidth int, timeLabel string) []string {
	labels := strings.Repeat(" ", labelWidth+2) + axisLabels(points, times)
	if timeLabel == "" {
		return []string{labels}
	}
	n, z := utf8.RuneCountInString(labels), utf8.RuneCountInString(timeLabel)
	if n+1+z <= labelWidth+2+len(points)+rightGap {
		return []string{labels + " " + timeLabel}
	}
	return []string{labels, strings.Repeat(" ", max(0, labelWidth+2+len(points)-z)) + timeLabel}
}

// A name too long for a legend, shortened in the middle (legend.jsx shorten)
func shorten(name string, most int) string {
	r := []rune(name)
	if len(r) <= most {
		return name
	}
	head := most / 2 // Math.ceil((most - 1) / 2)
	return string(r[:head]) + "…" + string(r[len(r)-(most-1-head):])
}

// legend is Ditt0's Legend: a swatch in each series' colour, then its name, dim, wrapping at width (0: never)
func legend(ss []sceneSeries, swatch string, width int) Block {
	var out Block
	var row Line
	for _, s := range ss {
		item := Line{{swatch, Style{Fg: s.Color}}, {" ", Style{}}, {shorten(s.Name, maxName), DimStyle}}
		if len(row) > 0 && width > 0 && row.Width()+legendGap+item.Width() > width {
			out = append(out, row)
			row = nil
		}
		if len(row) > 0 {
			row = append(row, Segment{strings.Repeat(" ", legendGap), Style{}})
		}
		row = append(row, item...)
	}
	return append(out, row)
}

func padLeft(s string, w int) string {
	if n := utf8.RuneCountInString(s); n < w {
		return strings.Repeat(" ", w-n) + s
	}
	return s
}

// HH:MM on the local clock, as Dash0 shows times, and the zone once at the end of the axis
func clock(t time.Time) string { return t.Local().Format("15:04") }

func zoneOf(t time.Time) string {
	_, off := t.Local().Zone()
	if off == 0 {
		return "UTC"
	}
	sign := "+"
	if off < 0 {
		sign, off = "-", -off
	}
	h, m := off/3600, off%3600/60
	if m == 0 {
		return "GMT" + sign + strconv.Itoa(h)
	}
	return fmt.Sprintf("GMT%s%d:%02d", sign, h, m)
}

// LineType is how a Timeseries draws its lines, named as Ditt0's JS Timeseries names them.
type LineType string

const (
	// LineTypeBox draws box-drawing glyphs (╭─╮), a row at a time. The default.
	LineTypeBox LineType = "box"
	// LineTypeBraille draws one thin line of braille dots: two dot columns a cell, four dot rows a row.
	LineTypeBraille LineType = "braille"
)

// TimeseriesProps are Timeseries' props, named as Ditt0's JS Timeseries names them where it has them.
type TimeseriesProps struct {
	// Every series, all the same length
	Series []Series
	// A time per sample, drawn on the local clock, its zone at the end of the axis. Labels, when given, are written
	// as they are instead, as the JS chart writes its times, and TimeLabel after them (the JS timeLabel)
	Times     []time.Time
	Labels    []string
	TimeLabel string
	// Scales with the values ('bytes', 'seconds', 'ms', 'percent', 'ratio', 'decimal'), or any text written after
	// the number ('cores', '/s')
	Unit string
	// The chart's width in cells, as the JS chart measures its Box; 0 draws a column a sample, 60 at most
	Width int
	// The plot's height in rows; 0 is Ditt0's 12 on one axis and 5 a panel for small multiples. For small multiples
	// it is every panel's rows together, split evenly between them, the first panels taking what is left over, and
	// never under 3 a panel. Each panel's head line and the blank line above it come on top
	Rows int
	// Keep every series on one axis even where one would flatten there, as the JS multiples={false} does: such as
	// CPU usage against its request and limit, where reading one against the other is the point
	OneAxis bool
	// How the lines are drawn: LineTypeBox (the default), box-drawing glyphs a row at a time, or LineTypeBraille, one
	// thin line of braille dots, a quarter of a row fine
	LineType LineType
	// The theme series with no colour take theirs from; the zero value draws with Dark
	Theme Theme
}

// minMultipleRows is the fewest rows a small multiple gets when Rows splits a height between panels: three keeps its
// top, middle and bottom labels on rows of their own
const minMultipleRows = 3

// Timeseries is Ditt0's Timeseries: box-drawing or braille lines over a y axis of round numbers, a time axis and a legend; or
// small multiples, a panel each, for four series or more, or where one would draw flat on the others' axis.
func Timeseries(p TimeseriesProps) Block {
	t := p.Theme
	if len(t.Series) == 0 {
		t = Dark
	}
	if len(p.Series) == 0 || len(p.Series[0].Values) == 0 {
		return Block{Text("No data in this time range.", DimStyle)}
	}
	times, timeLabel := p.Labels, p.TimeLabel
	if times == nil && len(p.Times) > 0 {
		times = make([]string, len(p.Times))
		for i, at := range p.Times {
			times[i] = clock(at)
		}
		if timeLabel == "" {
			timeLabel = zoneOf(p.Times[len(p.Times)-1])
		}
	}

	raw := make([]sceneSeries, len(p.Series))
	for i, s := range p.Series {
		if s.Color == "" {
			s.Color = t.ManagedSeriesColor(i)
		}
		raw[i] = sceneSeries{s, bucket(s.Values, 1)}
	}
	shared := p.OneAxis || (len(raw) <= maxShared && !flattens(raw, timeseriesRows))
	// rowsOf(i) is panel i's plot height
	rowsOf := func(int) int { return multipleRows }
	switch {
	case shared && p.Rows > 0:
		rowsOf = func(int) int { return p.Rows }
	case shared:
		rowsOf = func(int) int { return timeseriesRows }
	case p.Rows > 0:
		n := len(raw)
		rowsOf = func(i int) int {
			share := p.Rows / n
			if i < p.Rows%n {
				share++
			}
			return max(minMultipleRows, share)
		}
	}
	panelsOf := func(all []sceneSeries) [][]sceneSeries {
		if shared {
			return [][]sceneSeries{all}
		}
		out := make([][]sceneSeries, len(all))
		for i := range all {
			out[i] = all[i : i+1]
		}
		return out
	}
	var exact []span
	for _, panel := range panelsOf(raw) {
		exact = append(exact, rangeOf(panel))
	}
	// The scale from the largest value, not the rounded axis, so 698 ms stays ms on an axis to 1000. Time, bytes and
	// percent take one scale across every panel, counts one a panel
	largest := func(r span) float64 { return math.Max(math.Abs(r.min), math.Abs(r.max)) }
	widest := 0.0
	for _, r := range exact {
		widest = math.Max(widest, largest(r))
	}
	ranges := make([]span, len(exact))
	scales := make([]scale, len(exact))
	units := make([]string, len(exact))
	labels := make([]map[int]string, len(exact))
	labelWidth := 0
	for i, r := range exact {
		ranges[i] = nice(r)
		if sharesScale(p.Unit) {
			scales[i] = scaleFor(p.Unit, widest)
		} else {
			scales[i] = scaleFor(p.Unit, largest(r))
		}
		units[i] = strings.TrimSpace(scales[i].suffix)
		labels[i] = yLabels(rowsOf(i), ranges[i], scales[i])
		for _, l := range labels[i] {
			labelWidth = max(labelWidth, utf8.RuneCountInString(l))
		}
	}
	if shared {
		labelWidth = max(labelWidth, utf8.RuneCountInString(units[0]))
	}
	samples := len(p.Series[0].Values)
	columns := min(samples, maxColumns)
	if p.Width > 0 {
		columns = max(2, p.Width-labelWidth-2-rightGap)
	}
	size := (samples + columns - 1) / columns
	bucketed := make([]sceneSeries, len(raw))
	for k, s := range raw {
		points := bucket(s.Values, size)
		if p.Width > 0 && len(points) > 1 && len(points) < columns {
			points = stretch(points, columns)
		}
		bucketed[k] = sceneSeries{s.Series, points}
	}
	points := bucketed[0].points

	var out Block
	// The unit, once, above the y axis
	if shared && units[0] != "" {
		out = append(out, Text(padLeft(units[0], labelWidth), DimStyle))
	}
	for i, panel := range panelsOf(bucketed) {
		// Small multiples: each panel headed by its series' name and unit, a blank row above it
		if !shared {
			if i > 0 {
				out = append(out, Line{})
			}
			head := panel[0].Name
			if units[i] != "" {
				head += " · " + units[i]
			}
			out = append(out, Line{{strings.Repeat(" ", labelWidth+2), Style{}}, {"━ ", Style{Fg: panel[0].Color}}, {head, DimStyle}})
		}
		rows := rowsOf(i)
		var cells [][]cell
		if p.LineType == LineTypeBraille {
			cells = drawBraille(panel, rows, ranges[i], len(points))
		} else {
			cells = draw(panel, rows, ranges[i])
		}
		for r := 0; r < rows; r++ {
			l, labelled := labels[i][r]
			axis := strings.Repeat(" ", labelWidth) + " │"
			if labelled {
				axis = padLeft(l, labelWidth) + " ┤"
			}
			line := Line{{axis, DimStyle}}
			for _, c := range cells[r] {
				switch {
				case c.text != "":
					line = append(line, Segment{c.text, Style{Fg: c.color}})
				case labelled:
					line = append(line, Segment{"┄", DimStyle})
				default:
					line = append(line, Segment{" ", DimStyle})
				}
			}
			out = append(out, line)
		}
	}
	// The time axis: a tick under the start, middle and end, their times, and the zone
	var axis strings.Builder
	axis.WriteString(strings.Repeat(" ", labelWidth) + " └")
	ticks := ticksOf(points)
	for c := range points {
		if c == ticks[0] || c == ticks[1] || c == ticks[2] {
			axis.WriteString("┬")
		} else {
			axis.WriteString("─")
		}
	}
	out = append(out, Text(axis.String(), DimStyle))
	for _, row := range timeRows(points, times, labelWidth, timeLabel) {
		out = append(out, Text(row, DimStyle))
	}
	// Under a shared panel, which colour is which series, past the y axis
	if shared {
		wrap := 0
		if p.Width > 0 {
			wrap = p.Width - labelWidth - 2
		}
		out = append(out, Indent(labelWidth+2, legend(bucketed, "━", wrap))...)
	}
	return out
}
