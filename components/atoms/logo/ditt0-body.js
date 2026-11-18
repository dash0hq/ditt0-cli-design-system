// Ditt0's body, drawn as terminal glyphs the way Claude Code draws its own mascot: the geometry of
// Ditt0's web body (six pink circles of radius 32 with a face), sampled into quadrant blocks,
// four pixels per cell, in one colour, with the face left as holes

export const PINK = 0xe15ff4
const FACE = 0xf5f5f5
export const NONE = 0x01000000
// Quadrant glyphs indexed by which pixels are filled: 1 top left, 2 top right, 4 bottom left, 8 bottom right
export const QUADRANTS = ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█'

const R = 32
// A quadrant pixel is twice as tall as it is wide, so it spans twice the units vertically
const UNIT_X = 136 / 28
const UNIT_Y = UNIT_X * 2
const LEFT_EDGE = -68
const TOP_EDGE = -78
export const COLUMNS = 14
export const ROWS = 6
// Each pixel is the majority of a 3x3 sample, so edges round off instead of stair-stepping
const SAMPLES = 3

// Circle centres per pose, in agent-body's frame: top middle, bottom middle, bottom left, top left, top right,
// bottom right
const REST = [[0, -7], [0, 16], [-32, 16], [-32, -16], [32, -16], [32, 16]]
const UP = [[0, -16], [0, 16], [-32, 16], [-32, -16], [32, -16], [32, 16]]
const RIGHT = [[11, -7], [0, 16], [-32, 16], [-21, -16], [43, -16], [32, 16]]
const SWAY_LEFT = [[-11, -7], [0, 16], [-32, 16], [-43, -16], [21, -16], [32, 16]]

// mood: 'idle' breathes and blinks, 'thinking' bobs, 'working' sways, 'done' hops (with doneFor)
export function targetPose(mood, seconds) {
    if (mood === 'thinking') return Math.floor(seconds / 0.7) % 3 === 2 ? REST : UP
    if (mood === 'working') return Math.floor(seconds / 0.65) % 2 === 0 ? RIGHT : SWAY_LEFT
    return REST
}

// Moves each centre a step toward the pose, so changes ease in as the CSS transition does
export const ease = (current, target, step = 0.3) => current.map(([x, y], i) => {
    const [tx, ty] = target[i] ?? [x, y]
    return [x + (tx - x) * step, y + (ty - y) * step]
})

export const restPose = () => REST.map(([x, y]) => [x, y])

// f: { pose, mood, seconds, doneFor }; doneFor is the seconds since a hop began, or -1
function colourAt(px, py, f) {
    // Breathing scales the whole body from its feet; the hop lifts it, squashing on landing
    const breath = f.mood === 'idle' ? (1 - Math.cos((2 * Math.PI * f.seconds) / 3.6)) / 2 : 0
    const hop = f.doneFor >= 0 && f.doneFor < 0.6 ? Math.sin((Math.PI * f.doneFor) / 0.6) : 0
    const sx = 1 + 0.035 * breath
    const sy = 1 - 0.03 * breath
    const x = px / sx
    const y = (py + 22 * hop - 40) / sy + 40

    const eyesShut = f.seconds % 4.8 > 4.6
    const eyeTop = eyesShut ? -9 : -17
    const isEye = (Math.abs(x + 28) <= 5.5 || Math.abs(x - 28) <= 5.5) && y >= eyeTop && y <= 2
    const isMouth = y >= 11 && (x / 32) ** 2 + ((y - 11) / 18) ** 2 <= 1
    if (isEye || isMouth) return FACE

    const inBody = f.pose.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= R * R)
    return inBody ? PINK : NONE
}

// Whether most of the pixel is body, not background or face
function pixel(column, row, f) {
    let filled = 0
    for (let i = 0; i < SAMPLES; i++) {
        for (let j = 0; j < SAMPLES; j++) {
            const x = LEFT_EDGE + (column + (i + 0.5) / SAMPLES) * UNIT_X
            const y = TOP_EDGE + (row + (j + 0.5) / SAMPLES) * UNIT_Y
            if (colourAt(x, y, f) === PINK) filled++
        }
    }
    return filled * 2 > SAMPLES * SAMPLES
}

// One frame as rows of glyphs, for a surface without a Raster to blit
export function glyphs(f) {
    return Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLUMNS }, (_, column) => {
        const quarters = [pixel(column * 2, row * 2, f), pixel(column * 2 + 1, row * 2, f), pixel(column * 2, row * 2 + 1, f), pixel(column * 2 + 1, row * 2 + 1, f)]
        return QUADRANTS[quarters.reduce((m, on, i) => on ? m | (1 << i) : m, 0)]
    }).join(''))
}

// One frame as RasterProps cells: base64 of [codePoint, foreground, background] u32 triplets
export function frame(f) {
    const words = new Uint32Array(COLUMNS * ROWS * 3)
    glyphs(f).forEach((line, row) => [...line].forEach((glyph, column) => {
        words.set([glyph.charCodeAt(0), glyph === ' ' ? NONE : PINK, NONE], (row * COLUMNS + column) * 3)
    }))
    return toBase64(new Uint8Array(words.buffer))
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function toBase64(bytes) {
    let out = ''
    for (let i = 0; i < bytes.length; i += 3) {
        const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
        out += ALPHABET.charAt((n >> 18) & 63) + ALPHABET.charAt((n >> 12) & 63)
        out += i + 1 < bytes.length ? ALPHABET.charAt((n >> 6) & 63) : '='
        out += i + 2 < bytes.length ? ALPHABET.charAt(n & 63) : '='
    }
    return out
}
