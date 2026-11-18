import { el } from '../../elements.js'
import { MAX_NAME, ITEM_GAP } from './legend.constants.js'

// A name too long for a legend, shortened in the middle, where two services' names differ least (TRUNC-002):
// gcp-warehouse-sync-tasks-worker reads gcp-integrat…oral-worker
const shorten = (name, max = MAX_NAME) => {
    if (name.length <= max) return name
    const head = Math.ceil((max - 1) / 2)
    return `${name.slice(0, head)}…${name.slice(name.length - (max - 1 - head))}`
}

// Which colour is which series, under a chart: a swatch in the series' colour, then its name, dim, one after
// another, going on to the next line when the row is full. Dash0 shows a legend on most of its panels.
// items: [{ name, color, swatch }]; swatch: the glyph for every item without its own: '━' for a line, '█' for a bar,
// a texture (▓, ▒) for a stacked segment
export function Legend({ items, swatch = '━' }) {
    const { Box, Text } = el()
    return Box({
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: ITEM_GAP,
        children: items.map(item => Box({
            flexDirection: 'row',
            columnGap: 1,
            children: [
                Text({ color: item.color, children: [item.swatch ?? swatch] }),
                Text({ dimColor: true, children: [shorten(item.name)] }),
            ],
        })),
    })
}
