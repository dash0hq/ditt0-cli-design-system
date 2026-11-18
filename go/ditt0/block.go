package ditt0

import (
	"fmt"
	"strconv"
	"strings"
	"unicode/utf8"
)

// A Block is what every component here returns: lines of styled segments, every glyph one cell wide (box drawing,
// block elements). Blocks join side by side or stacked, and take Ditt0's rounded border, as Ink's Box draws them in
// Claude Code. Write one to a terminal with ANSI, or read its text with String.

// Style is how a segment draws: hex colours for its text and fill, bold and dim, and a link a click opens.
type Style struct {
	Fg, Bg    string
	Bold, Dim bool
	Link      string
}

// Segment is a run of text in one style.
type Segment struct {
	Text  string
	Style Style
}

// Line is one terminal row.
type Line []Segment

// Block is a stack of rows.
type Block []Line

// DimStyle is the theme's text, dimmed: axes, labels and notes.
var DimStyle = Style{Dim: true}

// Text is a line of one segment.
func Text(s string, st Style) Line { return Line{{s, st}} }

// Width is the line's width in cells.
func (l Line) Width() int {
	w := 0
	for _, s := range l {
		w += utf8.RuneCountInString(s.Text)
	}
	return w
}

// Cut is the line cut to w cells, so a terminal narrower than the page never wraps it onto the next row.
func (l Line) Cut(w int) Line {
	var out Line
	if w <= 0 {
		return out
	}
	for _, s := range l {
		r := []rune(s.Text)
		if len(r) >= w {
			return append(out, Segment{string(r[:w]), s.Style})
		}
		out, w = append(out, s), w-len(r)
	}
	return out
}

// Width is the widest line's width in cells.
func (b Block) Width() int {
	w := 0
	for _, l := range b {
		w = max(w, l.Width())
	}
	return w
}

// PadTo pads the line with spaces to w cells.
func PadTo(l Line, w int) Line {
	if n := l.Width(); n < w {
		return append(append(Line{}, l...), Segment{strings.Repeat(" ", w-n), Style{}})
	}
	return l
}

// Row puts blocks side by side, top aligned, gap empty cells between them.
func Row(gap int, blocks ...Block) Block {
	height := 0
	for _, b := range blocks {
		height = max(height, len(b))
	}
	out := make(Block, height)
	for i, b := range blocks {
		w := b.Width()
		for r := 0; r < height; r++ {
			var l Line
			if r < len(b) {
				l = b[r]
			}
			if i < len(blocks)-1 {
				l = PadTo(PadTo(l, w), w+gap)
			}
			out[r] = append(out[r], l...)
		}
	}
	return out
}

// Column stacks blocks, gap empty rows between them; nil blocks are left out.
func Column(gap int, blocks ...Block) Block {
	var out Block
	for _, b := range blocks {
		if b == nil {
			continue
		}
		if out != nil {
			for i := 0; i < gap; i++ {
				out = append(out, Line{})
			}
		}
		out = append(out, b...)
	}
	return out
}

// Indent moves the block n cells right.
func Indent(n int, b Block) Block {
	out := make(Block, len(b))
	for i, l := range b {
		out[i] = append(Line{{strings.Repeat(" ", max(0, n)), Style{}}}, l...)
	}
	return out
}

// Border draws a rounded border around the block, padX empty cells inside it either side, the content padded to
// width cells.
func Border(b Block, width, padX int, edge Style) Block {
	inner := width - 2 - 2*padX
	padX = max(0, padX)
	pad := strings.Repeat(" ", padX)
	// A terminal a few cells wide still draws the corners, never a negative run
	rule := strings.Repeat("─", max(0, width-2))
	out := Block{Text("╭"+rule+"╮", edge)}
	for _, l := range b {
		row := Line{{"│", edge}, {pad, Style{}}}
		row = append(row, PadTo(l, inner)...)
		out = append(out, append(row, Segment{pad, Style{}}, Segment{"│", edge}))
	}
	return append(out, Text("╰"+rule+"╯", edge))
}

// Cut is every line cut to w cells.
func (b Block) Cut(w int) Block {
	out := make(Block, len(b))
	for i, l := range b {
		out[i] = l.Cut(w)
	}
	return out
}

// BoxProps are Box's props, as Ditt0's JS Box names them: Direction "column" (the default) or "row", Gap cells or rows
// between children, Padding cells inside, and Border, Ditt0's dim rounded border.
type BoxProps struct {
	Direction    string
	Gap, Padding int
	Border       bool
}

// Box is Ditt0's Box: children stacked or side by side, with space between and around them, and an optional dim
// rounded border.
func Box(p BoxProps, children ...Block) Block {
	var inner Block
	if p.Direction == "row" {
		inner = Row(p.Gap, children...)
	} else {
		inner = Column(p.Gap, children...)
	}
	if p.Padding > 0 && !p.Border {
		inner = Indent(p.Padding, inner)
	}
	if !p.Border {
		return inner
	}
	padY := make(Block, max(0, p.Padding-1))
	inner = append(append(append(Block{}, padY...), inner...), padY...)
	padX := max(1, p.Padding)
	return Border(inner, inner.Width()+2+2*padX, padX, DimStyle)
}

func sgr(hex string, base int) string {
	r, _ := strconv.ParseUint(hex[1:3], 16, 8)
	g, _ := strconv.ParseUint(hex[3:5], 16, 8)
	b, _ := strconv.ParseUint(hex[5:7], 16, 8)
	return fmt.Sprintf("%d;2;%d;%d;%d", base, r, g, b)
}

// runs is the line with neighbours of one style joined, so a row of same-coloured cells costs one escape, not one each.
func (l Line) runs() Line {
	out := make(Line, 0, len(l))
	for _, s := range l {
		if s.Text == "" {
			continue
		}
		if n := len(out); n > 0 && out[n-1].Style == s.Style {
			out[n-1].Text += s.Text
			continue
		}
		out = append(out, s)
	}
	return out
}

// ANSI is the line with 24-bit colour escapes, and OSC 8 for links, ready to write to a terminal.
func (l Line) ANSI() string {
	var sb strings.Builder
	for _, s := range l.runs() {
		var codes []string
		if s.Style.Bold {
			codes = append(codes, "1")
		}
		if s.Style.Dim {
			codes = append(codes, "2")
		}
		if s.Style.Fg != "" {
			codes = append(codes, sgr(s.Style.Fg, 38))
		}
		if s.Style.Bg != "" {
			codes = append(codes, sgr(s.Style.Bg, 48))
		}
		if s.Style.Link != "" {
			sb.WriteString("\x1b]8;;" + s.Style.Link + "\x1b\\")
		}
		if len(codes) > 0 {
			sb.WriteString("\x1b[" + strings.Join(codes, ";") + "m" + s.Text + "\x1b[0m")
		} else {
			sb.WriteString(s.Text)
		}
		if s.Style.Link != "" {
			sb.WriteString("\x1b]8;;\x1b\\")
		}
	}
	return sb.String()
}

// ANSI is every line with its escapes, joined by newlines.
func (b Block) ANSI() string {
	lines := make([]string, len(b))
	for i, l := range b {
		lines[i] = l.ANSI()
	}
	return strings.Join(lines, "\n")
}

// String is the block's text with no styling, a line per row.
func (b Block) String() string {
	lines := make([]string, len(b))
	for i, l := range b {
		var sb strings.Builder
		for _, s := range l {
			sb.WriteString(s.Text)
		}
		lines[i] = sb.String()
	}
	return strings.Join(lines, "\n")
}
