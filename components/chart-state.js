import { redraw } from './elements.js'

// What a chart shows that the person picked on the chart itself: its line type and its zoom, by the chart's key.
// A chart keeps these by default, so every chart on every page has its Dots / Lines / Bars switch and its zoom
// without the page wiring them; a page that wires its own passes them in and the chart keeps nothing
const states = new Map()

// The chart last used, which holds the zoom keys (i, o, r) on a page of several; null before any is
let active = null

export const chartStateOf = (key) => states.get(key) ?? {}
export const holdsKeys = (key) => active === null || active === key

// Changes a chart's view and draws again
export const setChartState = (key, patch) => {
    active = key
    states.set(key, { ...chartStateOf(key), ...patch })
    redraw()
}
