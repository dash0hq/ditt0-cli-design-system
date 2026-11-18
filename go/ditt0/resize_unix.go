//go:build unix

package ditt0

import (
	"os"
	"os/signal"
	"syscall"
)

// notifyResize sends when the terminal changes size (SIGWINCH)
func notifyResize() (<-chan os.Signal, func()) {
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGWINCH)
	return ch, func() { signal.Stop(ch) }
}
