// Box, Text and Button only exist inside a render hook. The hook hands them
// over here once per render, so every component file can use them.
// The surface name comes along too: every table carries every element name
// (a missing one draws an empty fragment), so check the surface, not the element.
// The theme is the person's /config theme, read at session start: 'dark' or 'light'
let elements = {}
let surfaceName = 'terminal'
let themeName = 'dark'

export const setElements = (resolved, surface) => { elements = resolved; surfaceName = surface }
export const el = () => elements
export const surface = () => surfaceName

// Keys are the address of a control within one drawing, so two controls never share one. The gallery draws every
// story of a component on one page, and stories of one component key their controls alike: while it draws a story
// it scopes the keys, and every component makes its keys with scoped(), so a key reads <story id>/<key> there.
// Anywhere else the scope is empty and a key is as given
let keyScope = ''
export const scopeKeys = (scope) => { keyScope = scope }
export const scoped = (key) => keyScope + key
// Draws inside a scope of its own, under the one it is drawn in: a page drawing two charts of the same series keys
// each by its block, so they never share a key, a width or a zoom
export const inScope = (scope, draw) => {
    const outer = keyScope
    keyScope = outer + scope
    try {
        return draw()
    } finally {
        keyScope = outer
    }
}

// Claude Code's themes are named dark, light, and variants of each (light-daltonized, dark-ansi, ...).
// Anything not named light, including a theme that follows the terminal, draws with the dark colours
export const setTheme = (name) => { themeName = /light/i.test(String(name ?? '')) ? 'light' : 'dark' }
export const theme = () => themeName

// The key of the control holding the keyboard's focus ring in this plugin's site, as the ui.focus hook last saw it
// (hooks/register.jsx), so a bordered control can light its border where Tab and the arrows put the ring
let focusKey = null
export const setFocused = (key) => { const changed = focusKey !== (key ?? null); focusKey = key ?? null; return changed }
export const isFocused = (key) => key !== null && key === focusKey

// Draws the site again: a component that keeps its own view (a chart's line type, its zoom: chart-state.js) calls it
// after a press, as a page's handler calls $.ui.invalidate. Each render hook hands it over with its elements
let redrawSite = () => {}
export const setRedraw = (fn) => { redrawSite = fn }
export const redraw = () => redrawSite()
