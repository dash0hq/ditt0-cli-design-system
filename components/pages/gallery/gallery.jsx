import { el, surface, scopeKeys } from '../../elements.js'
import { measureHeight, heightOf } from '../../measure.js'
import { PaneTemplate } from '../../templates/pane/pane.jsx'
import { Text } from '../../atoms/text/text.jsx'
import { Loader } from '../../atoms/loader/loader.jsx'
import { Button } from '../../atoms/button/button.jsx'
import { Heading } from '../../atoms/heading/heading.jsx'
import { Select } from '../../atoms/select/select.jsx'
import { raised } from '../../foundations/tokens/tokens.js'
import { Dash0Logo, Ditt0Logo, DITT0_SIZE } from '../../atoms/logo/logo.jsx'
import { PINK } from '../../atoms/logo/ditt0-body.js'
import { Table, parseTable } from '../../molecules/table/table.jsx'
import { COMPONENTS, storyById } from './stories.js'

// One story drawn with its args, the props named in meta.actions wired to onAction, as Storybook's actions.
// meta.argsOnAction maps an action to the arg it sets, { onChange: 'value' }: the action's first value comes back
// as that arg, so a controlled component follows its own presses, as a story with Storybook's useArgs does.
// Or to a function of the action's values returning the args to set, when one press sets several:
// { onRangeChange: (range) => ({ range, zoom: undefined }) }
// onAction(action, update): action is the call as text; update the args it sets, or undefined. args: those kept so far
// scope: what the story's keys start with (elements.js scoped), so stories drawn side by side never share one
export const drawStory = ({ component, story }, onAction, args = {}, scope = '') => {
    const sets = component.meta.argsOnAction ?? {}
    const actions = Object.fromEntries((component.meta.actions ?? []).map(name =>
        [name, (...values) => onAction(`${name}(${values.map(v => JSON.stringify(v)).join(', ')})`, typeof sets[name] === 'function' ? sets[name](...values) : sets[name] ? { [sets[name]]: values[0] } : undefined)]))
    const all = { ...story.args, ...args, ...actions }
    scopeKeys(scope)
    try {
        return story.render ? story.render(all) : component.meta.component(all)
    } finally {
        scopeKeys('')
    }
}

// The story's canvas and, once it has raised one, the last action under it, as Storybook's actions panel.
// args: the ones its actions have set
export function Canvas({ entry, lastAction, onAction, args, scope }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column" gap={1}>
            {drawStory(entry, onAction, args, scope)}
            {lastAction ? <Text color="subtle">{`Action: ${lastAction}`}</Text> : null}
        </ui.Box>
    )
}

// A doc page, its markdown with stories drawn live where it says, as Storybook's MDX does with <Canvas of={...} />.
// A line of its own, <Canvas story="foundations-colors-color-manager--meaning" />, draws that story there.
// The page's own # title is left out: the gallery draws it large above the page
const EMBED = /^<Canvas story="([^"]+)" \/>$/
const BUDGET = 12000
// How many nodes a tree draws: every element and every string in it
const nodes = (tree) => Array.isArray(tree) ? tree.reduce((n, t) => n + nodes(t), 0)
    : tree && typeof tree === 'object' ? 1 + nodes(tree.children ?? []) : tree === null || tree === undefined || tree === false ? 0 : 1
// Every story of the component (stories) shows: one the page doesn't draw with a <Canvas /> is drawn after it,
// under Stories, by name, so every variant is on the one page, as Storybook's docs page scrolls through them.
// A drawing holds 20000 nodes at most, and a page of many charts passes it: past BUDGET a story waits behind a
// Show button, as a long Storybook page loads its stories as they scroll in. One shown is drawn whatever it costs.
// onAction(action, update, storyId); storyArgs, storyActions: the args each story's actions have set, and the last
// action it raised, by story id. shown: the ids of stories shown past the budget; onShow(id) asks to show one
// bare: the stories alone, with no Stories heading and no names, for an Examples page shown as itself
export function DocPage({ text, stories = [], onAction, storyArgs = {}, storyActions = {}, shown = [], onShow, bare = false }) {
    const ui = el()
    const parts = []
    const drawn = new Set()
    let used = 0
    const canvas = (id) => {
        const found = storyById(id)
        if (!found) return <Text color="subtle">{`No story ${id}`}</Text>
        const tree = <Canvas entry={found} scope={`${id}/`} lastAction={storyActions[id]} args={storyArgs[id]} onAction={(action, update) => onAction(action, update, id)} />
        const cost = nodes(tree)
        if (used + cost > BUDGET && !shown.includes(id)) {
            return <ui.Button key={`show-${id}`} plain onPress={() => onShow?.(id)}><ui.Text color="suggestion">{`▸ Show ${found.name}`}</ui.Text></ui.Button>
        }
        used += cost
        // On a raised panel, a step lighter than the page with a border of its level, so a story never reads as
        // part of the doc's text around it
        const { bg, stroke } = raised()
        return <ui.Box flexDirection="column" backgroundColor={bg} borderStyle="round" borderColor={stroke} paddingX={2} paddingY={1}>{tree}</ui.Box>
    }
    let lines = []
    const flush = () => { if (lines.join('').trim()) parts.push(<ui.Markdown text={lines.join('\n')} />); lines = [] }
    // A markdown table draws as a Table, its columns sharing the pane's width and its cells wrapping, where
    // Markdown would draw it as wide as its longest row
    let table = []
    const flushTable = () => {
        const parsed = parseTable(table)
        if (parsed) { flush(); parts.push(<Table columns={parsed.columns} rows={parsed.rows} wrap />) }
        else lines.push(...table)
        table = []
    }
    for (const line of text.replace(/^\s*# [^\n]*\n/, '').split('\n')) {
        if (line.trim().startsWith('|')) { table.push(line); continue }
        if (table.length) flushTable()
        const id = line.trim().match(EMBED)?.[1]
        if (!id) { lines.push(line); continue }
        flush()
        drawn.add(id)
        parts.push(canvas(id))
    }
    if (table.length) flushTable()
    flush()
    const rest = stories.filter(s => !drawn.has(s.id))
    if (rest.length && !bare) parts.push(<ui.Markdown text="## Stories" />)
    for (const s of rest) {
        if (!bare) parts.push(<Heading level="heading">{s.name}</Heading>)
        parts.push(canvas(s.id))
    }
    return <ui.Box flexDirection="column" gap={1}>{parts}</ui.Box>
}

// The menu's groups are the atomic levels, in build order: foundations, atoms, molecules, organisms, templates,
// then the pages built from them, as Examples (stories.js LEVELS)
const LEVELS = { foundations: 'Foundations', atoms: 'Atoms', molecules: 'Molecules', organisms: 'Organisms', templates: 'Templates', pages: 'Examples' }
const ORDER = Object.keys(LEVELS)
export const levelOf = (c) => LEVELS[c.level] ?? c.level
// What a component is for, from the middle of its title (Components/Charts/BarChart is Charts), drawn under its name
export const categoryOf = (c) => {
    const [root, middle] = c.title.split('/')
    return root === 'Components' ? middle : root === 'Features' ? 'Examples' : root
}

// Every component, by level, then by name within it
export const ALL = [...COMPONENTS].sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level) || a.name.localeCompare(b.name))

// The gallery's header: Dash0's logo first, then the library's name large, with a line on what this is
// logo: Dash0's logo before the name, where no sidebar carries it (a phone)
export function GalleryHeader({ logo = false }) {
    const ui = el()
    return (
        <ui.Box flexDirection="row" flexWrap="wrap" alignItems="flex-end" columnGap={3} rowGap={1}>
            {logo ? <Dash0Logo /> : null}
            <ui.Box flexDirection="column">
                <Heading level="h2">Ditt0</Heading>
                <Text color="subtle">{`Dash0 components for Claude Code · ${ALL.length} components`}</Text>
            </ui.Box>
        </ui.Box>
    )
}

// The header and a dim rule under it, as wide as the page, so the header never reads as part of the page below
export function GalleryHead({ logo = false }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column" gap={1}>
            <GalleryHeader logo={logo} />
            <ui.Box height={1} overflow="hidden">
                <ui.Text dimColor wrap="truncate">{'─'.repeat(400)}</ui.Text>
            </ui.Box>
        </ui.Box>
    )
}

// The sidebar's groups: each level's components, in the order of ALL
const GROUPS = []
for (const c of ALL) {
    const last = GROUPS[GROUPS.length - 1]
    if (last?.name === levelOf(c)) last.items.push(c)
    else GROUPS.push({ name: levelOf(c), items: [c] })
}
// Narrow, so the page keeps its width in a docked pane (Claude Code docks one at most 45% of the window, 90 columns asked): as wide as
// Ditt0 at its foot (DITT0_SIZE), a longer name cut with …; Dash0's mark at its top takes 10
const NAV_WIDTH = DITT0_SIZE.columns
// The gap between the sidebar and the page
const NAV_GAP = 1
// The rows the mark and the blank row under it take above the list
const LOGO_ROWS = 4
// Collapsed, the sidebar is its ☰ alone, and the page takes the rest
const RAIL_WIDTH = 2
// The cells the page keeps clear of the pinned sidebar: its width and the gap, open or collapsed
export const navSpace = (open = true) => (open ? NAV_WIDTH : RAIL_WIDTH) + NAV_GAP
export const NAV_SPACE = navSpace()
// The button that collapses the sidebar and opens it again
export const NAV_TOGGLE = 'gallery-menu'
const NavToggle = ({ onToggle }) => {
    const ui = el()
    return (
        <ui.Box key={`${NAV_TOGGLE}-box`} flexShrink={0}>
            <ui.Button key={NAV_TOGGLE} plain onPress={() => onToggle?.()}><ui.Text dimColor hover={{ scope: NAV_TOGGLE, color: 'suggestion', dimColor: false }}>☰</ui.Text></ui.Button>
        </ui.Box>
    )
}
// What the ☰ does, beside the sidebar on the ☰'s row while it's hovered: over the page, so the sidebar keeps its
// width. Drawn last: a later sibling paints over an earlier one
export const navHint = (open) => (open ? 'Collapse menu' : 'Open menu')
const NavHint = ({ open }) => {
    const ui = el()
    return (
        <ui.Box position="absolute" top={0} left={navSpace(open)} display="none" hover={{ scope: NAV_TOGGLE, display: 'flex' }} backgroundColor="inverseText" paddingX={1}>
            <ui.Text>{navHint(open)}</ui.Text>
        </ui.Box>
    )
}
// The narrowest the page draws: a chart at FIT_MIN, the narrowest every chart is checked to fit (fits.test.ts), on its
// story's raised panel, its border and padding. A pane narrower than this cuts the page at its right edge, rather
// than squeezing a chart until its rows wrap
export const FIT_MIN = 60
export const PAGE_MIN = FIT_MIN + 6
// Whether the open sidebar leaves the page its PAGE_MIN, and its scrollbar a column, in a pane bodyColumns wide.
// Until the pane says, it does. A docked pane is at most 45% of the window, 72 columns in a 160-column terminal:
// there the sidebar starts collapsed, so the page takes the pane's width
export const navFits = (bodyColumns) => !bodyColumns || bodyColumns >= navSpace(true) + PAGE_MIN + 1
// The page's height, as the pinned layout measures it
export const PAGE_KEY = 'gallery-page'
// The furthest the page scrolls in a window of bodyRows. Until its height is measured, it isn't held at an end,
// so a page whose measure is late still scrolls
export const clampPage = (offset, bodyRows) => {
    const height = heightOf(PAGE_KEY)
    return Math.max(0, height ? Math.min(offset, height - bodyRows) : offset)
}
// Ditt0 at the foot of the sidebar's list, an easter egg: its Raster's key, which the hooks module blits to make it
// breathe and blink while the gallery is open, and the Button under it that makes it hop
export const NAV_DITT0 = 'gallery-ditt0'
export const DITT0_HOP = 'gallery-ditt0-hop'
// The rows it takes under the list: the blank row above it, its body and the line under it
const DITT0_ROWS = 1 + DITT0_SIZE.rows + 1
// How many rows the sidebar's list takes: each group's name and its components, a blank row between groups, and
// Ditt0 at its foot
export const navRows = () => GROUPS.reduce((rows, g) => rows + 1 + g.items.length, 0) + GROUPS.length - 1 + DITT0_ROWS
// The furthest the sidebar's list scrolls in a window of bodyRows
export const clampNav = (offset, bodyRows) => Math.max(0, Math.min(offset, navRows() - (bodyRows - LOGO_ROWS)))

// Where a window stands over what it scrolls, one column down its side: a dim track │ as tall as the window and,
// on it, a thumb ┃ in the accent colour, as long as the share of the rows the window shows and as far down as it
// has scrolled. Nothing while it all fits, or before total is known
export function Scrollbar({ total, visible, offset }) {
    const ui = el()
    if (!total || !visible || total <= visible) return null
    const thumb = Math.max(1, Math.round(visible * visible / total))
    const top = Math.round(Math.min(1, Math.max(0, offset / (total - visible))) * (visible - thumb))
    return (
        <ui.Box flexDirection="column" width={1} flexShrink={0}>
            {Array.from({ length: visible }, (_, r) => r >= top && r < top + thumb
                ? <ui.Text color="suggestion">┃</ui.Text>
                : <ui.Text dimColor>│</ui.Text>)}
        </ui.Box>
    )
}

// Ditt0, the pink mascot, at the end of the sidebar's list: drawn at rest, then repainted by the hooks module.
// A Raster takes no press or hover, so the line under it does: it lights pink while the pointer is over Ditt0, and a press
// makes Ditt0 hop (onHop)
export function NavDitt0({ onHop }) {
    const ui = el()
    return (
        <ui.Box key="gallery-ditt0-box" flexDirection="column">
            <Ditt0Logo id={NAV_DITT0} />
            <ui.Button key={DITT0_HOP} plain onPress={() => onHop?.()}>
                <ui.Text dimColor wrap="truncate-end" hover={{ color: `#${PINK.toString(16)}`, dimColor: false }}>{'  hi, Ditt0'}</ui.Text>
            </ui.Button>
        </ui.Box>
    )
}

// The components down the left, as Storybook's sidebar: under each level's name (Atoms, Molecules, ...), dim and
// in capitals, its components, the open one marked in the accent colour. On a phone, too narrow for a sidebar, a
// Select at the top, each option named with its level
// offset: the rows of the list scrolled past, when the gallery pins it beside a page that scrolls (navRows);
// visible: the rows the list shows there, for its Scrollbar. onDitt0: Ditt0's hop, at the list's foot (NavDitt0)
// A name as the sidebar's list has room for, beside its marker and the scrollbar, cut with … when longer: a Button's
// Text isn't cut by its width, it wraps
const NAME_ROOM = NAV_WIDTH - 2 - 1
const navName = (name) => name.length <= NAME_ROOM ? name : `${name.slice(0, NAME_ROOM - 1).trimEnd()}…`
// onToggle: the ☰ in its top right corner, that collapses it (Gallery's navOpen)
export function ComponentNav({ value, onChange, offset = 0, visible, onDitt0, onToggle }) {
    const ui = el()
    if (surface() === 'mobile') {
        return <Select id="component" label="Component" value={value} options={ALL.map(c => ({ value: c.id, label: `${levelOf(c)} · ${c.name}` }))} onValueChange={onChange} />
    }
    // Dash0's mark, without the wordmark, stays at the top; the list under it scrolls by offset, clipped
    return (
        <ui.Box flexDirection="column" width={NAV_WIDTH} flexShrink={0} gap={1}>
            <ui.Box flexDirection="row" justifyContent="space-between">
                <Dash0Logo wordmark={false} />
                {onToggle ? <NavToggle onToggle={onToggle} /> : null}
            </ui.Box>
            <ui.Box flexDirection="row" flexShrink={1} overflow="hidden">
                <ui.Box flexDirection="column" flexGrow={1} flexShrink={1} minWidth={0} gap={1} marginTop={-offset}>
                    {GROUPS.map(group => (
                        <ui.Box flexDirection="column">
                            <ui.Text dimColor bold>{group.name.toUpperCase()}</ui.Text>
                            {group.items.map(c => (
                                <ui.Button key={`nav-${c.id}`} plain onPress={() => onChange?.(c.id)}>
                                    {c.id === value
                                        ? <ui.Text color="suggestion" bold wrap="truncate-end">{`▌ ${navName(c.name)}`}</ui.Text>
                                        : <ui.Text wrap="truncate-end">{`  ${navName(c.name)}`}</ui.Text>}
                                </ui.Button>
                            ))}
                        </ui.Box>
                    ))}
                    <NavDitt0 onHop={onDitt0} />
                </ui.Box>
                {visible ? <Scrollbar total={navRows()} visible={visible} offset={offset} /> : null}
            </ui.Box>
        </ui.Box>
    )
}

// The gallery, Storybook in a pane: the header, every component in a list, and the open one's page: its name
// large, then its doc with every story drawn live in it, to scroll through.
// docs: the open component's markdown, null while it loads. onComponent(id); onAction(action, update, storyId);
// storyArgs, storyActions: by story id; shown, onShow: the stories shown past the page's budget (DocPage)
// live: the open component's page drawn live, for an Examples page that has one; drawn in place of its doc
// scroll: the pane's window over the tree ({ offset, bodyRows }, the Pane's props.scroll). With it the sidebar is
// pinned: the tree is the window's height, the sidebar a column that never moves, and the page scrolls itself by
// pageOffset; navOffset scrolls the sidebar's own list. The hooks module moves both (ui.scroll): the wheel over the
// sidebar its list, anything else the page. Without scroll the two scroll together, as the engine scrolls a pane
// onDitt0: a press under Ditt0, at the sidebar's foot, to make it hop
// navOpen: the sidebar open (the default), or collapsed to its ☰ alone, so the page takes the pane's width;
// onNavToggle: its ☰ pressed, either way
export function Gallery({ componentId, docs, storyArgs = {}, storyActions = {}, shown = [], onComponent, onAction, onShow, onClose, scroll, navOffset = 0, pageOffset = 0, live, onDitt0, navOpen = true, onNavToggle }) {
    const ui = el()
    const component = ALL.find(c => c.id === componentId) ?? ALL[0]
    const category = `${levelOf(component)} · ${categoryOf(component)}`
    // live: an Examples page drawn live (hooks/register.jsx), shown alone: no doc, no stories, nothing to explain it
    // An Examples page without a live one: its first story alone, as the page it shows, with no doc around it
    const example = !live && component.level === 'pages'
        ? <DocPage text="" stories={component.stories.slice(0, 1)} onAction={onAction} storyArgs={storyArgs} storyActions={storyActions} shown={shown} onShow={onShow} bare />
        : null
    const page = live || example ? <ui.Box flexDirection="column" flexGrow={1} flexShrink={1}>{live ?? example}</ui.Box> : (
        <ui.Box flexDirection="column" flexGrow={1} flexShrink={1} gap={1}>
            <ui.Box flexDirection="column">
                <Heading level="h2">{component.name}</Heading>
                <Text color="subtle">{category}</Text>
            </ui.Box>
            {docs === null || docs === undefined
                ? <Loader label="Loading…" id="docs-loading" />
                : <DocPage text={docs || `No doc page at ${component.docs} yet.`} stories={component.stories} onAction={onAction} storyArgs={storyArgs} storyActions={storyActions} shown={shown} onShow={onShow} />}
        </ui.Box>
    )
    // The foot: the component before and after this one in the sidebar's order, and Close; Tab and Enter reach them
    const at = ALL.indexOf(component)
    const step = (by) => onComponent?.(ALL[(at + by + ALL.length) % ALL.length].id)
    const actions = [
        <Button id="gallery-previous" label="Previous" variant="transparent" onClick={() => step(-1)} />,
        <Button id="gallery-next" label="Next" variant="transparent" onClick={() => step(1)} />,
        ...(onClose ? [<Button id="gallery-close" label="Close" variant="transparent" onClick={onClose} />] : []),
    ]
    if (surface() === 'mobile') {
        const nav = <ComponentNav value={component.id} onChange={onComponent} />
        return <PaneTemplate nav={<GalleryHead logo />} body={<ui.Box flexDirection="column" gap={1}>{nav}{page}</ui.Box>} footer={component.docs} actions={actions} />
    }
    if (!scroll?.bodyRows) {
        const nav = navOpen
            ? <ComponentNav value={component.id} onChange={onComponent} onDitt0={onDitt0} onToggle={onNavToggle} />
            : <ui.Box flexDirection="column" width={RAIL_WIDTH} flexShrink={0}><NavToggle onToggle={onNavToggle} /></ui.Box>
        const body = <ui.Box flexDirection="row" columnGap={NAV_GAP}>{nav}<ui.Box flexDirection="column" flexGrow={1} minWidth={PAGE_MIN}>{page}</ui.Box><NavHint open={navOpen} /></ui.Box>
        return <PaneTemplate nav={<GalleryHead />} body={body} footer={component.docs} actions={actions} />
    }
    // Pinned: the tree is exactly as tall as the pane's window, so the engine has nothing to scroll and the sidebar
    // never moves. The page scrolls itself: its column is clipped to the window and moved up by pageOffset, which
    // the hooks module keeps (ui.scroll) within the page's height, measured under PAGE_KEY by a strip one column
    // wide beside it, as tall as the page: never over it, where it would take the page's clicks and hover
    const pageView = (
        <ui.Box flexDirection="column" flexGrow={1} flexShrink={1} minWidth={PAGE_MIN} height={scroll.bodyRows} overflow="hidden">
            <ui.Box flexDirection="row" flexShrink={0} marginTop={-pageOffset}>
                <ui.Box flexDirection="column" flexGrow={1} flexShrink={1}>
                    <PaneTemplate nav={<GalleryHead />} body={page} footer={component.docs} actions={actions} />
                </ui.Box>
                {measureHeight(PAGE_KEY)}
            </ui.Box>
        </ui.Box>
    )
    return (
        <ui.Box key="gallery-pinned" flexDirection="row" columnGap={NAV_GAP} height={scroll.bodyRows} overflow="hidden">
            <ui.Box key="gallery-nav" flexDirection="column" width={navOpen ? NAV_WIDTH : RAIL_WIDTH} flexShrink={0} height={scroll.bodyRows} overflow="hidden">
                {navOpen
                    ? <ComponentNav value={component.id} onChange={onComponent} offset={clampNav(navOffset, scroll.bodyRows)} visible={scroll.bodyRows - LOGO_ROWS} onDitt0={onDitt0} onToggle={onNavToggle} />
                    : <NavToggle onToggle={onNavToggle} />}
            </ui.Box>
            {pageView}
            <Scrollbar total={heightOf(PAGE_KEY)} visible={scroll.bodyRows} offset={pageOffset} />
            <NavHint open={navOpen} />
        </ui.Box>
    )
}
