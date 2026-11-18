import { test, expect } from 'claude-code/testing'
import { mountStory, clientKey, SURFACES } from '../../../../tests/story.ts'

// The chart's rows of runs, as text: the ones that never shrink
const linesOf = async (ui: any) => {
    const text = (n: any): string => typeof n === 'string' ? n : (n?.children ?? []).map(text).join('')
    const rows: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.flexDirection === 'row' && b.props.flexShrink === 0)
    return rows.map(text)
}
const BAR = /^[▐█▏▎▍▌▋▊▉]+$/

for (const surface of SURFACES) {
    test(`a gantt chart heads each section and draws each task's bar in its section's colour on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-ganttchart--default', surface, 'dark')
        for (const section of ['Design', 'Build', 'Launch']) expect(await ui.find({ type: 'Text', text: section } as any)).toMatchObject({ props: { bold: true } })
        expect(await ui.find({ type: 'Text', text: /^  Tokens from Dash0 *$/ } as any)).toBeDefined()
        // A name past 22 characters is cut with …
        expect(await ui.find({ type: 'Text', text: /^  Docs and the \/book ga… *$/ } as any)).toBeDefined()
        // The axis on top: its ticks, and the days they mark
        expect(await ui.find({ type: 'Text', text: /^ +┬─+┬/ } as any)).toMatchObject({ props: { dimColor: true } })
        expect(await ui.find({ type: 'Text', text: /Oct 5/ } as any)).toBeDefined()
        const bars: any[] = await ui.findAll({ type: 'Text', text: BAR } as any)
        expect(bars.length).toBe(6)
        // Two in Design, three in Build, one in Launch: three colours
        expect(new Set(bars.map(b => b.props.color)).size).toBe(3)
        expect(bars[0].props.color).toBe(bars[1].props.color)
        expect(await ui.find({ type: 'Text', text: '◆' } as any)).toMatchObject({ props: { color: bars[5].props.color } })
        await ui.unmount()
    })

    test(`each task has its card, hidden till its task is hovered: name, start → end, duration, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-ganttchart--default', surface, 'dark')
        const cards: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.display === 'none' && b.props.position === 'absolute')
        expect(cards.length).toBe(7)
        expect(await ui.find({ type: 'Text', text: 'Oct 5 → Oct 14' } as any)).toMatchObject({ props: { bold: true } })
        expect(await ui.find({ type: 'Text', text: '9 d' } as any)).toMatchObject({ props: { dimColor: true } })
        // A milestone's card has its day alone
        expect(await ui.find({ type: 'Text', text: 'Nov 18' } as any)).toMatchObject({ props: { bold: true } })
        await ui.unmount()
    })
}

test('a bar starts and ends on the axis: the first task from the first tick, the last milestone at the axis end', async ($) => {
    const ui = await mountStory($, 'components-charts-ganttchart--default', 'terminal', 'dark')
    await ui.resize({ columns: 74, rows: 30, in: await clientKey(ui) } as any)
    const lines = await linesOf(ui)
    const axis = (await ui.find({ type: 'Text', text: /^ +┬/ } as any))!.text as string
    const first = lines.find(l => l.startsWith('  Tokens from Dash0'))!
    const firstTick = axis.indexOf('┬')
    expect(first[firstTick]).toBe('█')
    expect(first[firstTick - 1]).toBe(' ')
    const release = lines.find(l => l.startsWith('  Ditt0 1.0'))!
    expect(release.indexOf('◆')).toBe(axis.length - 2)
    // Every row is as wide as the axis at most, inside the Box
    expect(Math.max(...lines.map(l => [...l].length))).toBeLessThanOrEqual(axis.length)
    expect(axis.length).toBeLessThanOrEqual(74)
    await ui.unmount()
})

test("a trace's spans tick in milliseconds from the first, the failed span in the error red", async ($) => {
    const ui = await mountStory($, 'components-charts-ganttchart--waterfall', 'terminal', 'dark')
    expect(await ui.find({ type: 'Text', text: /^ +0 ms +100 ms/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^[█▐▏▎▍▌▋▊▉]+$/ } as any)).toBeDefined()
    expect((await ui.findAll({ type: 'Text', text: BAR } as any)).some((t: any) => t.props.color === '#e33238')).toBe(true)
    expect(await ui.find({ type: 'Text', text: '+33 ms → +36 ms' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '3 ms' } as any)).toBeDefined()
    await ui.unmount()
})

test('milestones are ◆ on the clock, in the colours their meaning gives', async ($) => {
    const ui = await mountStory($, 'components-charts-ganttchart--milestones', 'terminal', 'dark')
    // The marks on the rows alone: a text matches inside a longer one, and each hover card repeats its ◆
    const marks: any[] = await ui.findAll({ type: 'Text', text: /^◆$/ } as any)
    expect(marks.map(m => m.props.color)).toEqual(['#e33238', '#ffe54f', '#7eaacf'])
    expect(await ui.find({ type: 'Text', text: /^ +14:02/ } as any)).toBeDefined()
    await ui.unmount()
})

test('a card near the bottom moves up, so every card ends inside the chart', async ($) => {
    for (const story of ['default', 'waterfall', 'milestones']) {
        const ui = await mountStory($, `components-charts-ganttchart--${story}`, 'terminal', 'dark')
        const rows = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.flexDirection === 'row' && b.props.flexShrink === 0).length
        const cards: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute')
        // Each card is its border, its name and one or two lines
        for (const c of cards) expect(c.props.top + 2 + (c.children ?? []).filter(Boolean).length).toBeLessThanOrEqual(2 + rows)
        await ui.unmount()
    }
})

test('a gantt chart with no tasks says no data', async ($) => {
    const ui = await mountStory($, 'components-charts-ganttchart--no-data', 'terminal')
    expect(await ui.find({ type: 'Text', text: 'no data' } as any)).toMatchObject({ props: { dimColor: true } })
    await ui.unmount()
})
