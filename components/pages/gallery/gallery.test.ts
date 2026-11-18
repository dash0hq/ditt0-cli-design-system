import { test, expect, mock } from 'claude-code/testing'
import { navRows, clampNav } from './gallery.jsx'

const GALLERY = { plugin: 'ditt0-cli-design-system', component: 'Pane', requestId: 'ditt0', props: { title: 'Ditt0 components', isFocused: true } } as const

// The doc page is read from disk after a press, so wait for its redraw
const until = async (find: () => Promise<any>) => {
    for (let i = 0; i < 50 && !(await find()); i++) await new Promise(r => setTimeout(r, 20))
    return find()
}

test('the gallery heads with Dash0\'s logo first, then Ditt0 large, and no mascot in the header', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    // The one mascot is Ditt0's, at the sidebar's foot
    const rasters: any[] = await ui.findAll({ type: 'Raster' } as any)
    expect(rasters.map((r: any) => r.props.key)).toEqual(['gallery-ditt0'])
    expect(await ui.find({ type: 'Text', text: /Dash0 components for Claude Code/ } as any)).toBeDefined()
    const texts: any[] = await ui.findAll({ type: 'Text' } as any)
    expect(texts.some(t => t.props.color === '#ff8a67')).toBe(true)
    await ui.unmount()
})

for (const surface of ['terminal', 'desktop'] as const) {
    test(`the gallery lists every component in one sidebar, by atomic level, on ${surface}`, async ($) => {
        const ui = await $.ui.mount({ ...GALLERY, surface } as any)
        expect(await ui.find({ type: 'Button', key: 'nav-components-actions-button' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Button', key: 'nav-components-charts-barchart' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Button', key: 'nav-components-charts-chartcard' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Button', key: 'tab-atoms' } as any)).toBeUndefined()
        // Grouped under their levels, in capitals, in build order
        const heads: any[] = (await ui.findAll({ type: 'Text' } as any)).filter((t: any) => /^(FOUNDATIONS|ATOMS|MOLECULES|ORGANISMS|TEMPLATES|EXAMPLES)$/.test(t.text))
        expect(heads.map((t: any) => t.text)).toEqual(['FOUNDATIONS', 'ATOMS', 'MOLECULES', 'ORGANISMS', 'TEMPLATES', 'EXAMPLES'])
        expect(await ui.find({ type: 'Text', text: 'CHARTS' } as any)).toBeUndefined()
        await ui.unmount()
    })
}

test('a component opens on one page: its doc, then every story it leaves out, to scroll through', async ($, on) => {
    on('fs.read', async () => ({ value: '# Badge\n\nA short label.\n\n<Canvas story="components-feedback-badge--critical" />\n' }))
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await ui.press({ key: 'nav-components-feedback-badge' })
    expect(await until(() => ui.find({ type: 'Text', text: /^ Critical $/ } as any))).toBeDefined()
    // The page's # title is drawn large above it, not as markdown
    expect(await ui.find({ type: 'Markdown', text: /# Badge/ } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: '## Stories' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ Degraded $/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ New $/ } as any)).toBeDefined()
    await ui.unmount()
})

test('a doc page draws its markdown tables as a Table', async ($, on) => {
    on('fs.read', async () => ({ value: 'Intro.\n\n| Prop | Type |\n| --- | --- |\n| `label` | string \\| none |\n\n' }))
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await ui.press({ key: 'nav-components-actions-button' })
    expect(await until(() => ui.find({ type: 'Text', text: /^Prop$/ } as any))).toMatchObject({ props: { bold: true } })
    expect(await ui.find({ type: 'Text', text: /^string \| none$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /\| Prop/ } as any)).toBeUndefined()
    await ui.unmount()
})

test('a story on the page shows its last action under it, and only once it raised one', async ($, on) => {
    on('fs.read', async () => ({ value: '<Canvas story="components-inputs-switch--default" />\n' }))
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await ui.press({ key: 'nav-components-inputs-switch' })
    // Each story's keys start with its id, so two stories keying a control alike never clash
    const key = 'components-inputs-switch--default/Auto-refresh'
    await until(() => ui.find({ type: 'Button', key } as any))
    expect(await ui.find({ type: 'Text', text: /^Action:/ } as any)).toBeUndefined()
    await ui.press({ key })
    expect(await until(() => ui.find({ type: 'Text', text: /Action: onCheckedChange\(true\)/ } as any))).toBeDefined()
    await ui.unmount()
})

test('on a phone the components are a Select at the top, its options presses', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'mobile' } as any)
    expect(await ui.find({ type: 'Button', key: 'nav-components-actions-button' } as any)).toBeUndefined()
    await ui.press({ key: 'component-components-feedback-badge' })
    expect(await until(() => ui.find({ type: 'Text', text: /^ Critical $/ } as any))).toBeDefined()
    await ui.unmount()
})

test('a page of many charts draws the stories that fit, and a Show button for each of the rest', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await ui.press({ key: 'nav-components-charts-timeseries' })
    const show = await until(async () => (await ui.findAll({ type: 'Button' } as any)).find((b: any) => /^show-/.test(b.props.key)))
    expect(show).toBeDefined()
    await ui.press({ key: show.props.key })
    expect(await ui.find({ type: 'Button', key: show.props.key } as any)).toBeUndefined()
    await ui.unmount()
})


test('every story on a page sits on a raised panel, lighter than the page, so it never reads as the doc\'s text', async ($, on) => {
    on('fs.read', async () => ({ value: 'A short label.\n\n<Canvas story="components-feedback-badge--critical" />\n' }))
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await ui.press({ key: 'nav-components-feedback-badge' })
    await until(() => ui.find({ type: 'Text', text: /^ Critical $/ } as any))
    const panels: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.backgroundColor === '#27272a')
    // The embedded story and the six others under Stories
    expect(panels.length).toBe(7)
    expect(panels[0].props).toMatchObject({ borderStyle: 'round', borderColor: '#414144' })
    await ui.unmount()
})

test("the gallery's foot steps through the components and closes the pane", async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    expect(await ui.find({ type: 'Button', key: 'gallery-next' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'gallery-previous' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'gallery-close' } as any)).toBeDefined()
    // Next opens the second component in the sidebar's order
    const navs: any[] = (await ui.findAll({ type: 'Button' } as any)).filter((b: any) => /^nav-/.test(b.props.key))
    await ui.press({ key: 'gallery-next' })
    expect(await until(() => ui.find({ type: 'Text', text: new RegExp(`^▌ ${navs[1].text.trim()}$`) } as any))).toBeDefined()
    await ui.unmount()
})

test('the sidebar never moves: the gallery is the window\'s height, the page clipped and scrolling itself', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal', props: { ...GALLERY.props, scroll: { offset: 0, bodyRows: 40 } } } as any)
    // The whole tree fits the window, so the engine scrolls nothing and the sidebar stays where it is
    expect(await ui.find({ type: 'Box', key: 'gallery-pinned' } as any)).toMatchObject({ props: { height: 40, overflow: 'hidden' } })
    expect(await ui.find({ type: 'Box', key: 'gallery-nav' } as any)).toMatchObject({ props: { height: 40, overflow: 'hidden' } })
    expect((await ui.find({ type: 'Box', key: 'gallery-nav' } as any)).props.position).toBeUndefined()
    // The page measures its own height, to know how far it scrolls
    expect(await ui.find({ type: 'Client', key: 'gallery-page' } as any)).toMatchObject({ props: { height: '100%' } })
    await ui.unmount()
})

test('Dash0\'s logo heads the sidebar, and a rule parts the gallery\'s header from the page', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal', props: { ...GALLERY.props, scroll: { offset: 0, bodyRows: 40 } } } as any)
    const nav = await ui.find({ type: 'Box', key: 'gallery-nav' } as any)
    const inNav: any[] = (await ui.findAll({ type: 'Text' } as any)).filter((t: any) => t.props.color === '#ff8a67')
    expect(inNav.length).toBeGreaterThan(0)
    expect(JSON.stringify(nav)).toContain('#ff8a67')
    expect(await ui.find({ type: 'Text', text: /^─{40,}$/ } as any)).toBeDefined()
    await ui.unmount()
})

test('a scrollbar beside the sidebar says where its list stands: a dim track, the thumb at the top before a scroll', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal', props: { ...GALLERY.props, scroll: { offset: 0, bodyRows: 40 } } } as any)
    const texts: any[] = await ui.findAll({ type: 'Text' } as any)
    const thumb = texts.filter(t => t.text === '┃')
    const track = texts.filter(t => t.text === '│' && t.props.dimColor)
    // The list is longer than its 36 rows, so a bar: a thumb shorter than the track, in the accent colour
    expect(thumb.length).toBeGreaterThan(0)
    expect(thumb.length).toBeLessThan(36)
    expect(thumb[0].props.color).toBe('suggestion')
    expect(track.length).toBeGreaterThan(0)
    await ui.unmount()
})

test('an Examples page with a live page draws it live, asking Dash0, with no doc or saved stories around it', async ($, on) => {
    const asked: any[] = []
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return { value: { content: [], isError: true } } })
    on('fs.read', async () => ({ value: '# Tracing\n\nA long doc that should not show.\n' }))
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await ui.press({ key: 'nav-features-dash0-pages-tracing' })
    await until(async () => asked.length > 0 || undefined)
    expect(asked.length).toBeGreaterThan(0)
    expect(asked.every(e => /dash0/i.test(e.server))).toBe(true)
    expect(await ui.find({ type: 'Markdown', text: /A long doc/ } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: '## Stories' } as any)).toBeUndefined()
    await ui.unmount()
})

test('the page never draws narrower than every chart is checked to fit, so a narrow pane cuts it rather than wrap its charts', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal', props: { ...GALLERY.props, scroll: { offset: 0, bodyRows: 40 } } } as any)
    const boxes: any[] = await ui.findAll({ type: 'Box' } as any)
    expect(boxes.some(b => b.props.minWidth === 66)).toBe(true)
    await ui.unmount()
})

test('Ditt0 sits at the end of the sidebar, after the last Examples item, and its line makes it hop', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal', props: { ...GALLERY.props, scroll: { offset: 0, bodyRows: 40 } } } as any)
    const nav = JSON.stringify(await ui.find({ type: 'Box', key: 'gallery-nav' } as any))
    const ditt0 = nav.indexOf('"gallery-ditt0"')
    expect(ditt0).toBeGreaterThan(-1)
    // Every component's entry comes before it: the last Examples item, and nothing after it but its own line
    const navs: any[] = (await ui.findAll({ type: 'Button' } as any)).filter((b: any) => /^nav-/.test(b.props.key))
    expect(nav.indexOf(`"${navs[navs.length - 1].props.key}"`)).toBeLessThan(ditt0)
    expect(nav.slice(ditt0).match(/"nav-/)).toBeNull()
    expect(await ui.find({ type: 'Raster', key: 'gallery-ditt0' } as any)).toMatchObject({ props: { columns: 14, rows: 6 } })
    await ui.press({ key: 'gallery-ditt0-hop' })
    await ui.unmount()
})

test('the sidebar scrolls far enough to show Ditt0 at its foot', async () => {
    // The list's rows count Ditt0's: a blank row, its six rows and the line under it
    expect(clampNav(1e6, 40)).toBe(navRows() - 36)
    expect(navRows()).toBeGreaterThan(8)
})

test('on a phone the sidebar has no Ditt0', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'mobile' } as any)
    expect(await ui.find({ type: 'Raster' } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Button', key: 'gallery-ditt0-hop' } as any)).toBeUndefined()
    await ui.unmount()
})

test('Ditt0 breathes while the gallery is open, ten frames a second, and stops when it closes', async ($, on) => {
    const blits: any[] = []
    on('ui.close', async () => ({ value: undefined }))
    const clock = mock.clock(on, { now: Date.parse('2026-10-20T10:00:00.000Z') })
    on('ui.blit', async (_: any, e: any) => { blits.push(e); return { value: {} } })
    // A gallery an earlier test left open closes first, so its clock stops
    const first = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await first.press({ key: 'gallery-close' })
    await first.unmount()
    blits.length = 0
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await clock.advance(1000)
    expect(blits.length).toBeGreaterThanOrEqual(9)
    expect(blits.length).toBeLessThanOrEqual(11)
    expect(blits.every(b => b.requestId === 'ditt0' && b.key === 'gallery-ditt0' && typeof b.cells === 'string')).toBe(true)
    // Breathing: the frames are not all alike
    await clock.advance(2000)
    expect(new Set(blits.map(b => b.cells)).size).toBeGreaterThan(1)
    await ui.press({ key: 'gallery-close' })
    await ui.unmount()
    const closedAt = blits.length
    await clock.advance(1000)
    expect(blits.length).toBe(closedAt)
})

test('a blit that fails never throws: Ditt0 just keeps still', async ($, on) => {
    on('ui.close', async () => ({ value: undefined }))
    const clock = mock.clock(on, { now: Date.parse('2026-10-20T10:00:00.000Z') })
    let asked = 0
    on('ui.blit', async () => { asked++; throw new Error('no surface') })
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal' } as any)
    await clock.advance(500)
    expect(asked).toBeGreaterThan(0)
    expect(await ui.find({ type: 'Raster', key: 'gallery-ditt0' } as any)).toBeDefined()
    await ui.press({ key: 'gallery-close' })
    await ui.unmount()
})

test('the ☰ collapses the sidebar to itself alone, and opens it again', async ($) => {
    const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal', props: { ...GALLERY.props, scroll: { offset: 0, bodyRows: 40 } } } as any)
    const navs = async () => (await ui.findAll({ type: 'Button' } as any)).filter((b: any) => /^nav-/.test(b.props.key)).length
    expect(await navs()).toBeGreaterThan(40)
    expect(await ui.find({ type: 'Text', text: /^Collapse menu$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Box', key: 'gallery-nav' } as any)).toMatchObject({ props: { width: 14 } })
    await ui.press({ key: 'gallery-menu' })
    // Collapsed: no list, a column for the ☰, and the page draws on
    expect(await navs()).toBe(0)
    expect(await ui.find({ type: 'Box', key: 'gallery-nav' } as any)).toMatchObject({ props: { width: 2 } })
    expect(await ui.find({ type: 'Button', key: 'gallery-menu' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'gallery-next' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Open menu$/ } as any)).toBeDefined()
    await ui.press({ key: 'gallery-menu' })
    expect(await navs()).toBeGreaterThan(40)
    expect(await ui.find({ type: 'Box', key: 'gallery-nav' } as any)).toMatchObject({ props: { width: 14 } })
    await ui.unmount()
})

// A docked pane is at most 45% of the window: 72 columns in a 160-column terminal, 90 in a 200-column one
for (const [bodyColumns, width] of [[72, 2], [90, 14]] as const) {
    test(`in a pane ${bodyColumns} columns wide the sidebar starts ${width === 2 ? 'collapsed, so the page takes the width' : 'open'}`, async ($) => {
        const ui = await $.ui.mount({ ...GALLERY, surface: 'terminal', props: { ...GALLERY.props, bodyColumns, scroll: { offset: 0, bodyRows: 40 } } } as any)
        expect(await ui.find({ type: 'Box', key: 'gallery-nav' } as any)).toMatchObject({ props: { width } })
        await ui.unmount()
    })
}
