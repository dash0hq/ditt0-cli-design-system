// The fixed values of how Timeseries draws, in a module of their own with no imports, so scripts/export-tokens.mjs
// can read them for code outside Claude Code: it writes them into Ditt0's Go package (go/ditt0/constants_gen.go)

// A shared panel's height in rows
export const ROWS = 12
// Rows per panel once the series no longer share one grid: odd, so the middle label and its guideline sit exactly
// halfway
export const MULTIPLE_ROWS = 5
// Rows of a shared panel of bars: 3n + 2, so the lower gridline falls on a whole row (barScale)
export const BAR_ROWS = 11
// More series than this get a panel each, as small multiples
export const MAX_SHARED = 3
// Columns at most when the chart isn't told its width: a column per sample up to this
export const MAX_COLUMNS = 60
// Cells left empty right of the plot, so the line doesn't run into the edge of what holds it
export const RIGHT_GAP = 2

// Which sides of a cell a stroke leaves by, so strokes that cross in one cell merge into one glyph
export const UP = 1
export const DOWN = 2
export const LEFT = 4
export const RIGHT = 8
// A sample with no neighbour to join: the line stops either side of it
export const POINT = 16
export const GLYPHS = {
    [UP]: '╵', [DOWN]: '╷', [LEFT]: '╴', [RIGHT]: '╶',
    [LEFT | RIGHT]: '─', [UP | DOWN]: '│',
    [RIGHT | DOWN]: '╭', [LEFT | DOWN]: '╮', [UP | RIGHT]: '╰', [UP | LEFT]: '╯',
    [LEFT | RIGHT | DOWN]: '┬', [LEFT | RIGHT | UP]: '┴', [UP | DOWN | RIGHT]: '├', [UP | DOWN | LEFT]: '┤',
    [UP | DOWN | LEFT | RIGHT]: '┼',
}
// A cell whose sides make no glyph above: a lone point
export const LONE = '•'

// The y axis' round steps (nice): 1, 2, 5 or 10 times a power of ten, the smallest that splits the range into
// NICE_STEPS_PER_AXIS steps or fewer
export const NICE_MULTIPLES = [1, 2, 5, 10]
export const NICE_STEPS_PER_AXIS = 4
