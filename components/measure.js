import { el, scoped } from './elements.js'

// How wide a chart is drawn. A render isn't told the width of the Box it sits in, but a Client is: so a chart
// draws a Client that takes its Box's whole width, draws nothing, and posts its width in cells. The mount layer
// (hooks/register.jsx) stores it here under the Client's key and draws again; the chart then reads it.
// Mobile has no Client: there the width stays unknown, 0, and a chart is as wide as its content needs

const widths = new Map()

// The width a chart reads best at, in cells: about 500 px at a terminal's usual 8 px cell. Wider, its bars and lines
// spread thin, so a page of charts puts them side by side near this width (ChartGrid)
export const CHART_MAX = 64

// The width last measured under key, in cells; 0 until measured
export const widthOf = (key) => widths.get(key) ?? 0

// Stores a measured width; true when it changed, so the caller draws again only then
export const setWidth = (key, columns) => {
    if (widths.get(key) === columns) return false
    widths.set(key, columns)
    return true
}

// The height last measured under key, in rows, for a region given one (measureHeight); 0 until measured
const heights = new Map()
export const heightOf = (key) => heights.get(key) ?? 0

// A region as wide as the Box it sits in, reporting that width under key. Row-less
export const measure = (key) => el().Client({ key, module: './measure.client.js', width: '100%' })
// A strip one column wide, as tall as the row it sits in: put it beside what it measures, in a row, and it reports
// that height under key, as a page that scrolls itself needs to know how far it goes. Never lay a Client over
// content: it takes the pointer, and what's under it can't be clicked or hovered
export const measureHeight = (key) => el().Client({ key, module: './measure.client.js', width: 1, height: '100%' })

// What a chart that answers the pointer itself (timeseries.client.js) runs, by key: select(first, last), a drag
// across those columns; hover(column or null); zoom('in' or 'out'), a key pressed
const listeners = new Map()
export const listen = (key, on) => { listeners.set(key, on) }

// The last event each key's client sent, so one posted again is run once: a post can be replaced by a later one
// in the same frame, so a client sends its last event with every post until another comes
const seen = new Map()

// A client's post: its width, kept under its key; true when it changed, so the caller draws again. Then, for a
// chart, what the pointer is over and the event it sent: a drag's columns, or a zoom key
export const receive = (key, data) => {
    const columns = data?.columns
    let changed = Number.isInteger(columns) && columns > 0 && columns <= 1000 && setWidth(key, columns)
    const rows = data?.rows
    if (Number.isInteger(rows) && rows > 0 && heights.get(key) !== rows) {
        heights.set(key, rows)
        changed = true
    }
    const on = listeners.get(key)
    if (!on) return changed
    if (data.hover === null || Number.isInteger(data.hover)) on.hover?.(data.hover)
    const event = data.event
    if (event && Number.isInteger(event.seq) && event.seq > (seen.get(key) ?? 0)) {
        seen.set(key, event.seq)
        const [a, b] = Array.isArray(event.select) ? event.select : []
        if (Number.isInteger(a) && Number.isInteger(b)) on.select?.(Math.min(a, b), Math.max(a, b))
        if (event.zoom === 'in' || event.zoom === 'out' || event.zoom === 'reset') on.zoom?.(event.zoom)
    }
    return changed
}

// Whether a ui.message came from a measure region or a chart's client
export const isMeasure = (e) => /(measure|timeseries)\.client\.js$/.test(String(e.module))

const hash = (text) => {
    let h = 5381
    for (const c of text) h = (h * 33 + c.charCodeAt(0)) >>> 0
    return h.toString(36)
}

// A short, stable key from what a chart shows: the same chart keeps its width across redraws
export const keyFor = (prefix, text) => scoped(`${prefix}-${hash(text)}`)

// A short id for one chart's hover groups. A hover scope lights every element of this plugin's drawn under it, in
// any site, so two charts sharing ts-12 light their twelfth columns together: each chart scopes its own, from its
// key (which carries the story's scope in the gallery) and what it draws
export const hoverIdOf = (key, data) => `h${hash(`${key}|${data}`)}`
