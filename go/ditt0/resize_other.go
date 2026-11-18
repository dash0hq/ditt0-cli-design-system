//go:build !unix

package ditt0

import (
	"os"
	"time"

	"golang.org/x/term"
)

// notifyResize sends when the terminal changes size. With no SIGWINCH (Windows), it asks the size twice a second
func notifyResize() (<-chan os.Signal, func()) {
	ch, stop := make(chan os.Signal, 1), make(chan struct{})
	go func() {
		w, h, _ := term.GetSize(int(os.Stdout.Fd()))
		t := time.NewTicker(500 * time.Millisecond)
		defer t.Stop()
		for {
			select {
			case <-stop:
				return
			case <-t.C:
				if nw, nh, err := term.GetSize(int(os.Stdout.Fd())); err == nil && (nw != w || nh != h) {
					w, h = nw, nh
					select {
					case ch <- os.Interrupt:
					default:
					}
				}
			}
		}
	}()
	return ch, func() { close(stop) }
}
