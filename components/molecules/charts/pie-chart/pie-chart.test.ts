import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../../tests/story.ts'

// The disc's cells: █ inside it, the quadrant glyphs at its edge
const DISC = /^[ ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█]+$/

// The disc's lines: the Box that holds them, the first one that doesn't shrink
const discOf = async (ui: any) => {
    const find = (n: any): any => n?.props?.flexShrink === 0 && n?.props?.flexDirection === 'column' ? n : (n?.children ?? []).map(find).find(Boolean)
    const text = (n: any): string => typeof n === 'string' ? n : (n?.children ?? []).map(text).join('')
    return find(await ui.drawn()).children.map(text) as string[]
}

for (const surface of SURFACES) {
    test(`a pie chart is a round disc, each slice in its colour, a legend with value and share on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-piechart--default', surface, 'dark')
        const runs: any[] = (await ui.findAll({ type: 'Text', text: DISC } as any)).filter((t: any) => t.props.color)
        expect(new Set(runs.map(t => t.props.color)).size).toBeGreaterThan(3)
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

    test(`a slice too small for a cell still has its line in the legend on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-piechart--span-status', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^ERROR$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^ 0.02%$/ } as any)).toBeDefined()
        expect((await ui.findAll({ type: 'Text', text: DISC } as any)).some((t: any) => t.props.color === '#e33238' || t.props.backgroundColor === '#e33238')).toBe(false)
        await ui.unmount()
    })

    test(`a pie chart with nothing in it is a dim empty disc that says no data on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-piechart--no-data', surface)
        const runs: any[] = (await ui.findAll({ type: 'Text', text: DISC } as any)).filter((t: any) => t.text.trim())
        expect(runs.length).toBeGreaterThan(0)
        expect(runs.every(t => t.props.dimColor)).toBe(true)
        expect(await ui.find({ type: 'Text', text: /^no data$/ } as any)).toBeDefined()
        await ui.unmount()
    })
}

// A terminal cell is twice as tall as it is wide: a round disc is twice as many cells wide as it is lines tall,
// widest across its middle
test('the disc is round: twice as wide in cells as it is tall in lines, its middle lines wider than its top and bottom', async ($) => {
    const ui = await mountStory($, 'components-charts-piechart--few', 'terminal', 'dark')
    const lines = await discOf(ui)
    expect(lines.length).toBeGreaterThanOrEqual(8)
    expect(lines.every(l => l.length === lines.length * 2)).toBe(true)
    const width = (l: string) => l.trim().length
    const middle = lines.length / 2
    expect(width(lines[middle])).toBe(lines.length * 2)
    expect(width(lines[0])).toBeLessThan(width(lines[middle - 1]))
    expect(width(lines[lines.length - 1])).toBeLessThan(width(lines[middle]))
    expect(width(lines[0])).toBe(width(lines[lines.length - 1]))
    // Round at its edge: quadrant glyphs, not a staircase of whole cells
    expect(/[▘▝▖▗▙▟▛▜▌▐]/.test(lines.join(''))).toBe(true)
    await ui.unmount()
})

// The pie sizes to its Box: as large as fits beside the legend, 4 to 6 lines of radius
test('the pie fills its Box: a larger disc in a wider one, never under 8 lines', async ($) => {
    const ui = await mountStory($, 'components-charts-piechart--few', 'terminal', 'dark')
    const key = (await ui.find({ type: 'Client' } as any) as any).props.key
    await ui.resize({ columns: 40, rows: 40, in: key } as any)
    expect((await discOf(ui)).length).toBe(8)
    await ui.resize({ columns: 80, rows: 40, in: key } as any)
    expect((await discOf(ui)).length).toBe(12)
    await ui.unmount()
})

// In the terminal a Text nested in a Text lights with its hover group but the pointer over it never starts the
// hover: every run of cells must be a Text of its own, or its card never shows
test('every run of cells is a Text of its own, never nested in a Text, so hovering it shows its card', async ($) => {
    const ui = await mountStory($, 'components-charts-piechart--default', 'terminal', 'dark')
    const nested: string[] = []
    const walk = (n: any, inText: boolean) => {
        if (!n || typeof n !== 'object') return
        if (n.type === 'Text' && inText && /[▘▝▀▖▌▞▛▗▚▐▜▄▙▟█]/.test(JSON.stringify(n.children))) nested.push(JSON.stringify(n.children).slice(0, 40))
        for (const c of n.children ?? []) walk(c, inText || n.type === 'Text')
    }
    walk(await ui.drawn(), false)
    expect(nested).toEqual([])
    await ui.unmount()
})

// A later sibling paints over an earlier one: the cards come after the disc and the legend, or the legend covers them
test('the hover cards are drawn after the legend, so a shown card covers it', async ($) => {
    const ui = await mountStory($, 'components-charts-piechart--default', 'terminal', 'dark')
    const find = (n: any): any => n?.props?.flexWrap === 'wrap' ? n : (n?.children ?? []).map(find).find(Boolean)
    const kids: any[] = find(await ui.drawn()).children
    const firstCard = kids.findIndex(k => k.props?.position === 'absolute')
    expect(firstCard).toBeGreaterThan(0)
    expect(kids.slice(firstCard).every(k => k.props?.position === 'absolute')).toBe(true)
    await ui.unmount()
})
