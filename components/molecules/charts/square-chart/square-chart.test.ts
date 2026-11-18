import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../../tests/story.ts'

// Two squares to a cell, top and bottom, edge to edge: █ a cell of one slice, ▀ the top one's on the bottom one's
const SQUARES = /^[█▀]+$/

for (const surface of SURFACES) {
    test(`a square chart is a small 10 × 10 waffle, 10 cells by 5 lines, each slice in its colour, a legend with value and share on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-squarechart--default', surface, 'dark')
        const runs: any[] = (await ui.findAll({ type: 'Text', text: SQUARES } as any)).filter((t: any) => t.props.color)
        expect(runs.reduce((n, t) => n + t.text.length * 2, 0)).toBe(100)
        expect(await ui.find({ type: 'Text', text: /^api$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^500\/s$/ } as any)).toMatchObject({ props: { bold: true } })
        expect(await ui.find({ type: 'Text', text: /^ 71.4%$/ } as any)).toBeDefined()
        // Twelve services: the smallest four fold into Other, in the unset colour
        expect(await ui.find({ type: 'Text', text: /^Other$/ } as any)).toBeDefined()
        // A card per slice waits hidden, shown while its slice is hovered: its name, value and share
        const cards: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.display === 'none' && b.props.position === 'absolute')
        expect(cards.length).toBe(9)
        expect(await ui.find({ type: 'Text', text: /^500\/s 71.4%$/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a slice too small for a square still has its line in the legend on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-squarechart--span-status', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^ERROR$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^ 0.02%$/ } as any)).toBeDefined()
        expect((await ui.findAll({ type: 'Text', text: SQUARES } as any)).some((t: any) => t.props.color === '#e33238')).toBe(false)
        await ui.unmount()
    })

    test(`a square chart with nothing in it is an empty waffle that says no data on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-squarechart--no-data', surface)
        expect((await ui.findAll({ type: 'Text', text: /^░+$/ } as any)).filter((t: any) => t.props.dimColor).length).toBe(5)
        expect(await ui.find({ type: 'Text', text: /^no data$/ } as any)).toBeDefined()
        await ui.unmount()
    })
}

// In the terminal a Text nested in a Text lights with its hover group but the pointer over it never starts the
// hover: every run of squares must be a Text of its own, or its card never shows
test('every run of squares is a Text of its own, never nested in a Text, so hovering it shows its card', async ($) => {
    const ui = await mountStory($, 'components-charts-squarechart--default', 'terminal', 'dark')
    const nested: string[] = []
    const walk = (n: any, inText: boolean) => {
        if (!n || typeof n !== 'object') return
        if (n.type === 'Text' && inText && /[█▀]/.test(JSON.stringify(n.children))) nested.push(JSON.stringify(n.children).slice(0, 40))
        for (const c of n.children ?? []) walk(c, inText || n.type === 'Text')
    }
    walk(await ui.drawn(), false)
    expect(nested).toEqual([])
    await ui.unmount()
})

// A later sibling paints over an earlier one: the cards come after the square and the legend, or the legend covers them
test('the hover cards are drawn after the legend, so a shown card covers it', async ($) => {
    const ui = await mountStory($, 'components-charts-squarechart--default', 'terminal', 'dark')
    const find = (n: any): any => n?.props?.flexWrap === 'wrap' ? n : (n?.children ?? []).map(find).find(Boolean)
    const kids: any[] = find(await ui.drawn()).children
    const firstCard = kids.findIndex(k => k.props?.position === 'absolute')
    expect(firstCard).toBeGreaterThan(0)
    expect(kids.slice(firstCard).every(k => k.props?.position === 'absolute')).toBe(true)
    await ui.unmount()
})
