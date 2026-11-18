package ditt0

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"golang.org/x/term"
)

// Ditt0's Pane (components/templates/pane) for a terminal program: a page that fills the terminal, scrolls under a
// dim footer of key hints, switches time ranges on 1 to 4, and draws again as its data comes in. Every Go program
// that runs it takes the same keys.

// Key is a key the page answers besides its own: Key as the terminal sends it ("o"), Label for the footer
// ("open in Dash0"), Do what it runs.
type Key struct {
	Key, Label string
	Do         func()
}

// PaneProps are Run's props.
type PaneProps struct {
	// The page for a terminal width cells wide and height rows high, in the range selected. Run cuts it to the width
	// and scrolls it when it is higher than the terminal.
	Draw func(width, height int, r Range) Block
	// Asks for the data, in the background: at the start, every Refresh, on r and when the range changes. Run draws
	// again when it returns. ctx is cancelled when the range changes or the page quits: pass it to the requests, and
	// store nothing once ctx.Err() is set, so an answer for the old range never shows under the new one's label.
	// Draw and Fetch run at the same time, so guard what they share. Optional.
	Fetch func(ctx context.Context, r Range, width, height int)
	// The ranges 1 to 4 pick, LiveRanges when nil; none when empty. Range is the index of the one selected first.
	Ranges []Range
	Range  int
	// How often Fetch runs, 30 seconds when 0; never when below 0
	Refresh time.Duration
	// Keys besides Run's own, such as o to open the page in Dash0. Run's own win: arrows, j k b g G, Space, 1 to 9
	// while there are ranges, r with a Fetch, and q, Esc and Ctrl-C
	Keys []Key
	// What q does, for the footer: "quit" when empty, or "back to k9s"
	Quit string
	// Runs as soon as 1 to 4 picks a range, before Fetch: clear the old range's data there, so the page starts empty
	// rather than showing the old range under the new one's label
	OnRange func(r Range)
	// Fetch once, print the page to stdout and return, even in a terminal: a --once flag
	Once bool
}

// Frame is what Run writes for a page: the rows of body that fit over the footer from row scroll on, and the footer
// of hints, with "↑↓ scroll (n%)" first when the page is higher than the terminal. It returns scroll held inside the
// page.
func Frame(body Block, scroll, width, height int, hints string) (Block, int) {
	rows := max(1, height-1)
	scroll = max(0, min(scroll, len(body)-rows))
	if len(body) > rows {
		hints = fmt.Sprintf("↑↓ scroll (%d%%) · ", 100*(scroll+rows)/len(body)) + hints
	}
	out := make(Block, 0, rows+1)
	for i := 0; i < rows; i++ {
		var l Line
		if scroll+i < len(body) {
			l = body[scroll+i]
		}
		out = append(out, l.Cut(width))
	}
	return append(out, Text(" "+hints, DimStyle).Cut(width)), scroll
}

// Hints is the footer's text for the keys a page takes.
func Hints(p PaneProps) string {
	parts := []string{}
	for _, k := range p.Keys {
		parts = append(parts, k.Key+" "+k.Label)
	}
	if n := len(p.ranges()); n > 1 {
		parts = append(parts, fmt.Sprintf("1-%d range", n))
	}
	if p.Fetch != nil {
		parts = append(parts, "r refresh")
	}
	quit := p.Quit
	if quit == "" {
		quit = "quit"
	}
	return strings.Join(append(parts, "q "+quit), " · ")
}

func (p PaneProps) ranges() []Range {
	if p.Ranges == nil {
		return LiveRanges[:]
	}
	return p.Ranges[:min(len(p.Ranges), 9)]
}

// The terminal's size, from COLUMNS and LINES when it can't say
func size() (int, int) {
	w, h, err := term.GetSize(int(os.Stdout.Fd()))
	if err != nil || w <= 0 {
		w, h = 120, 50
		if n, err := strconv.Atoi(os.Getenv("COLUMNS")); err == nil && n > 0 {
			w = n
		}
		if n, err := strconv.Atoi(os.Getenv("LINES")); err == nil && n > 0 {
			h = n
		}
	}
	return w, h
}

// Run draws the page and answers keys until q, Esc or Ctrl-C: ↑↓ or j k a row, PgUp PgDn or b Space a page, Home End
// or g G the top and bottom, 1 to 4 the range, r Fetch now, and the page's own Keys. It draws on the alternate
// screen, so the terminal comes back as it was. With Once, or when stdin is not a terminal, it fetches once, prints the
// page and returns.
func Run(p PaneProps) error {
	ranges := p.ranges()
	sel := min(max(0, p.Range), max(0, len(ranges)-1))
	current := func() Range {
		if len(ranges) == 0 {
			return Range{}
		}
		return ranges[sel]
	}
	refresh := p.Refresh
	if refresh == 0 {
		refresh = 30 * time.Second
	}

	if p.Once || !term.IsTerminal(int(os.Stdin.Fd())) {
		w, h := size()
		if p.Fetch != nil {
			p.Fetch(context.Background(), current(), w, h)
		}
		fmt.Println(p.Draw(w, h, current()).Cut(w).ANSI())
		return nil
	}

	state, err := term.MakeRaw(int(os.Stdin.Fd()))
	if err != nil {
		return err
	}
	fmt.Print("\x1b[?1049h\x1b[?25l")
	defer func() {
		fmt.Print("\x1b[?25h\x1b[?1049l")
		_ = term.Restore(int(os.Stdin.Fd()), state)
	}()

	hints := Hints(p)
	scroll := 0
	draw := func() {
		w, h := size()
		var frame Block
		frame, scroll = Frame(p.Draw(w, h, current()), scroll, w, h, hints)
		var sb strings.Builder
		sb.WriteString("\x1b[H")
		for i, l := range frame {
			sb.WriteString(l.ANSI() + "\x1b[K")
			if i < len(frame)-1 {
				sb.WriteString("\r\n")
			}
		}
		fmt.Print(sb.String())
	}

	// One context per range: a range change or quitting cancels it, so a Fetch still running for the old range
	// stores nothing
	root, quit := context.WithCancel(context.Background())
	defer quit()
	ctx, cancel := context.WithCancel(root)
	// A new range: call off the old one's Fetch
	newRange := func() {
		cancel()
		ctx, cancel = context.WithCancel(root)
	}
	redraw := make(chan struct{}, 1)
	// A panic in Fetch comes back here, so the terminal is restored before it goes on
	panics := make(chan any, 1)
	ask := func() {
		draw()
		if p.Fetch == nil {
			return
		}
		c, r := ctx, current()
		w, h := size()
		go func() {
			defer func() {
				if v := recover(); v != nil {
					select {
					case panics <- v:
					default:
					}
				}
			}()
			p.Fetch(c, r, w, h)
			select {
			case redraw <- struct{}{}:
			default:
			}
		}()
	}

	// Keys as the terminal sends them. A blocked read can't be called off, so Run must be the program's last reader of
	// stdin; done stops the reader handing on keys once Run has returned
	keys, done := make(chan string), make(chan struct{})
	defer close(done)
	go func() {
		buf := make([]byte, 64)
		for {
			n, err := os.Stdin.Read(buf)
			if err != nil {
				close(keys)
				return
			}
			for _, k := range splitKeys(string(buf[:n])) {
				select {
				case keys <- k:
				case <-done:
					return
				}
			}
		}
	}()
	resized, stopResize := notifyResize()
	defer stopResize()
	var tick <-chan time.Time
	var ticker *time.Ticker
	if refresh > 0 && p.Fetch != nil {
		ticker = time.NewTicker(refresh)
		defer ticker.Stop()
		tick = ticker.C
	}

	ask()
	for {
		select {
		case k, ok := <-keys:
			if !ok {
				return nil
			}
			_, h := size()
			act, n := keyStep(k, scroll, max(1, h-2), len(ranges), p)
			switch act {
			case keyQuit:
				return nil
			case keyRefresh:
				ask()
			case keyScroll:
				scroll = n
				draw()
			case keyRange:
				sel = n
				newRange()
				if p.OnRange != nil {
					p.OnRange(current())
				}
				if ticker != nil {
					ticker.Reset(refresh)
				}
				ask()
			case keyOwn:
				if p.Keys[n].Do != nil {
					p.Keys[n].Do()
				}
				draw()
			}
		case <-tick:
			ask()
		case <-resized:
			draw()
		case <-redraw:
			draw()
		case v := <-panics:
			panic(v)
		}
	}
}

// splitKeys splits one read of the terminal into keys: a byte, or a whole escape sequence (ESC [ or ESC O up to its
// final byte), so an arrow never reads as Esc. A lone ESC is the Esc key
func splitKeys(in string) []string {
	var out []string
	for in != "" {
		k := in[:1]
		if len(in) > 2 && in[0] == 0x1b && (in[1] == '[' || in[1] == 'O') {
			for i := 2; i < len(in); i++ {
				if in[i] >= 0x40 && in[i] <= 0x7e {
					k = in[:i+1]
					break
				}
			}
		}
		out = append(out, k)
		in = in[len(k):]
	}
	return out
}

type keyAction int

const (
	keyNone keyAction = iota
	keyQuit
	keyRefresh
	keyScroll
	keyRange
	keyOwn
)

// keyStep is what a key does: quit, fetch again, scroll to a row, pick a range, or run one of the page's own Keys
// (n is the new scroll, the range's index or the key's index). page is the rows a page key moves
func keyStep(k string, scroll, page, ranges int, p PaneProps) (keyAction, int) {
	switch k {
	case "q", "Q", "\x03", "\x1b":
		return keyQuit, 0
	case "\x1b[A", "\x1bOA", "k":
		return keyScroll, scroll - 1
	case "\x1b[B", "\x1bOB", "j":
		return keyScroll, scroll + 1
	case "\x1b[5~", "b":
		return keyScroll, scroll - page
	case "\x1b[6~", " ":
		return keyScroll, scroll + page
	case "\x1b[H", "\x1bOH", "g":
		return keyScroll, 0
	case "\x1b[F", "\x1bOF", "G":
		return keyScroll, 1 << 20
	}
	if k == "r" && p.Fetch != nil {
		return keyRefresh, 0
	}
	if len(k) == 1 && ranges > 1 && k[0] >= '1' && int(k[0]-'1') < ranges {
		return keyRange, int(k[0] - '1')
	}
	for i, key := range p.Keys {
		if key.Key == k {
			return keyOwn, i
		}
	}
	return keyNone, 0
}
