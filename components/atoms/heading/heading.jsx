import { el, surface } from '../../elements.js'
import { FONTS, pixels, halfBlocks } from './font.js'

// A title's lines in the terminal: its words in a level's pixel font, as many to a line as fit in maxWidth cells.
// A line of words is as tall as the font: six lines for h1, four for h2, three for h3 (font.js)
const titleLines = (text, maxWidth, font) => {
    const rows = []
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const joined = rows.length ? `${rows[rows.length - 1]} ${word}` : word
        if (rows.length && pixels(joined, font)[0].length <= maxWidth) rows[rows.length - 1] = joined
        else rows.push(word)
    }
    // A blank line between two lines of words, so their descenders and capitals never touch
    return rows.flatMap((row, i) => [...(i ? [''] : []), ...halfBlocks(pixels(row, font))])
}

// What each level draws as where there are type sizes
const SIZES = { h1: 'title', h2: 'title', h3: 'heading' }

// A page's or a section's title. The terminal has one text size, so there it draws the text large, in a pixel
// font after the first Macintosh's Chicago (font.js), one font a level; a surface with type sizes draws it bold at
// its size.
// level: 'h1', the largest, six lines; 'h2', four lines, a page's title; 'h3', three lines; 'heading', bold text
// over a section; 'title', the same as h1. color: a hex or theme colour
// maxWidth: the cells a line of the title may take in the terminal; words that don't fit go onto the next line
export function Heading({ children, level = 'title', color, maxWidth = 72 }) {
    const ui = el()
    const text = [children].flat().join('')
    const size = level === 'title' ? 'h1' : level
    if (!FONTS[size]) return <ui.Text bold color={color} size="heading">{text}</ui.Text>
    if (surface() !== 'terminal') return <ui.Text bold color={color} size={SIZES[size]}>{text}</ui.Text>
    return (
        <ui.Box flexDirection="column">
            {titleLines(text, maxWidth, FONTS[size]).map(line => <ui.Text color={color} wrap="truncate-end">{line || ' '}</ui.Text>)}
        </ui.Box>
    )
}
