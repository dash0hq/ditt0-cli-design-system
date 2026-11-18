// The fixed values of how Stat draws, in a module of their own with no imports, so scripts/export-tokens.mjs can
// read them for code outside Claude Code: it writes them into Ditt0's Go package (go/ditt0/constants_gen.go)

// Digits three rows tall, drawn with box-drawing lines, so the number reads from across the room
export const DIGITS = {
    0: ['┏━┓', '┃ ┃', '┗━┛'], 1: ['╺┓ ', ' ┃ ', '╺┻╸'], 2: ['╺━┓', '┏━┛', '┗━╸'], 3: ['╺━┓', ' ━┫', '╺━┛'],
    4: ['╻ ╻', '┗━┫', '  ╹'], 5: ['┏━╸', '┗━┓', '╺━┛'], 6: ['┏━╸', '┣━┓', '┗━┛'], 7: ['╺━┓', '  ┃', '  ╹'],
    8: ['┏━┓', '┣━┫', '┗━┛'], 9: ['┏━┓', '┗━┫', '╺━┛'], '.': [' ', ' ', '╻'], '-': ['   ', '╺━╸', '   '],
}
// A cell filled from the bottom in eighths
export const EIGHTHS = '▁▂▃▄▅▆▇█'
// The sparkline's width in cells, at most
export const SPARK = 30
