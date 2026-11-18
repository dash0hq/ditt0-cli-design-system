import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

// The drawing's lines, as the rows of runs it draws them in
const linesOf = async (ui: any) => {
    const text = (n: any): string => typeof n === 'string' ? n : (n?.children ?? []).map(text).join('')
    const rows: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.flexDirection === 'row' && b.props.flexShrink === 0)
    return rows.map(text)
}

for (const surface of SURFACES) {
    test(`a flowchart draws its nodes as closed boxes, a decision with ◇ corners, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-flowdiagram--default', surface, 'dark')
        const lines = await linesOf(ui)
        for (const label of ['Client', 'api', 'Token valid?', 'order-history-api', '401', 'Postgres']) {
            expect(lines.some(l => l.includes(`${label}`))).toBe(true)
        }
        expect(lines.some(l => /^◇─+◇/.test(l))).toBe(true)
        // Every box's top and bottom edges are as wide as each other
        const tops = lines.flatMap(l => [...l.matchAll(/┌─*┐/g)].map(m => m[0].length))
        const bottoms = lines.flatMap(l => [...l.matchAll(/└[─┬]*┘/g)].map(m => m[0].length))
        expect(tops.sort()).toEqual(bottoms.sort())
        // The edge labels sit on their lines
        expect(lines.some(l => /yes/.test(l))).toBe(true)
        expect(lines.some(l => /no$/.test(l.trimEnd()))).toBe(true)
        await ui.unmount()
    })
}

test('boxes and labels draw in the theme text, links dim, arrowheads in the primary purple', async ($) => {
    for (const [theme, cta] of [['dark', '#8b5cf6'], ['light', '#8b5cf6']] as const) {
        const ui = await mountStory($, 'components-data-flowdiagram--default', 'terminal', theme)
        const arrows: any[] = await ui.findAll({ type: 'Text', text: /^[▼►]$/ } as any)
        expect(arrows.length).toBeGreaterThan(0)
        expect(arrows.every((t: any) => t.props.color === cta)).toBe(true)
        expect(await ui.find({ type: 'Text', text: /^┌─+┐/ } as any)).toMatchObject({ props: {} })
        expect((await ui.find({ type: 'Text', text: /^┌─+┐/ } as any))?.props.dimColor).toBeUndefined()
        expect((await ui.findAll({ type: 'Text', text: /^│$/ } as any)).some((t: any) => t.props.dimColor === true)).toBe(true)
        await ui.unmount()
    }
})

test('a left-to-right pipeline stays on one line when it fits, and turns top-down when it does not', async ($) => {
    const ui = await mountStory($, 'components-data-flowdiagram--pipeline', 'terminal', 'dark')
    const key = (await ui.find({ type: 'Client' } as any))?.props.key
    await ui.resize({ columns: 80, rows: 40, in: key } as any)
    expect((await linesOf(ui)).some(l => /Shopping cart.*Checkout page.*Payment.*Email/.test(l))).toBe(true)
    await ui.resize({ columns: 40, rows: 40, in: key } as any)
    const lines = await linesOf(ui)
    expect(lines.some(l => /Checkout page/.test(l) && !/Shopping/.test(l))).toBe(true)
    expect(Math.max(...lines.map(l => [...l].length))).toBeLessThanOrEqual(40)
    await ui.unmount()
})

test('a sequence diagram draws each participant at the top and the bottom, replies dashed', async ($) => {
    const ui = await mountStory($, 'components-data-flowdiagram--sequence', 'terminal', 'dark')
    const lines = await linesOf(ui)
    expect(lines.filter(l => /│ order-history-api │/.test(l)).length).toBe(2)
    expect(lines.some(l => /GET \/api\/order/.test(l))).toBe(true)
    expect(lines.some(l => /◄╌+/.test(l))).toBe(true)
    await ui.unmount()
})

test('a state diagram draws its states as boxes, the transitions labelled; a class diagram its members in bands', async ($) => {
    let ui = await mountStory($, 'components-data-flowdiagram--state', 'terminal', 'dark')
    let lines = await linesOf(ui)
    expect(lines.some(l => /│ +Pending +│/.test(l))).toBe(true)
    expect(lines.some(l => /threshold crossed/.test(l))).toBe(true)
    await ui.unmount()
    ui = await mountStory($, 'components-data-flowdiagram--class', 'terminal', 'dark')
    lines = await linesOf(ui)
    expect(lines.some(l => /│ \+traceId: string │/.test(l))).toBe(true)
    expect(lines.filter(l => /^├─+┤/.test(l.trim())).length).toBe(2)
    await ui.unmount()
})

test('source that is not a diagram drawn here, or that the renderer cannot read, shows an EmptyState saying why', async ($) => {
    let ui = await mountStory($, 'components-data-flowdiagram--unsupported', 'terminal', 'dark')
    expect(await ui.find({ type: 'Text', text: /^Can't draw this diagram$/ } as any)).toMatchObject({ props: { bold: true } })
    expect(await ui.find({ type: 'Text', text: /^A pie chart draws with PieChart/ } as any)).toMatchObject({ props: { dimColor: true } })
    await ui.unmount()
    ui = await mountStory($, 'components-data-flowdiagram--entity', 'terminal', 'dark')
    expect(await ui.find({ type: 'Text', text: /^erDiagram diagrams aren't drawn here/ } as any)).toBeDefined()
    await ui.unmount()
    ui = await mountStory($, 'components-data-flowdiagram--invalid', 'terminal', 'dark')
    expect(await ui.find({ type: 'Text', text: /^Can't draw this diagram$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Mermaid syntax/ } as any)).toMatchObject({ props: { dimColor: true } })
    await ui.unmount()
})
