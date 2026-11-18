import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../../tests/story.ts'
import { shadeOf } from './heatmap.jsx'

// Each row's y label, dim, then its runs of cells
const labelsOf = async (ui: any) => (await ui.findAll({ type: 'Text', text: / ┤$/ } as any)).map((t: any) => t.text.replace(' ┤', '').trim())

for (const surface of SURFACES) {
    test(`a heatmap draws a row per duration band, the slowest on top, a column per step, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-heatmap--default', surface, 'dark')
        expect(await labelsOf(ui)).toEqual(['10 s', '2.5 s', '500 ms', '100 ms', '25 ms', '5 ms', '1 ms', '0'])
        // 15 steps, two cells each before the chart is measured: the axis under them
        expect(await ui.find({ type: 'Text', text: /^ +└─{30}$/ } as any)).toBeDefined()
        // The range's slowest span and p99, over the plot
        expect(await ui.find({ type: 'Text', text: '4.33 min' } as any)).toMatchObject({ props: { bold: true } })
        expect(await ui.find({ type: 'Text', text: '2.11 s' } as any)).toMatchObject({ props: { bold: true } })
        // The shade scale, up to the busiest cell: 26.9K spans of 0–1 ms at 15:58
        expect(await ui.find({ type: 'Text', text: '░▒▓█' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: '26.9K' } as any)).toBeDefined()
        await ui.unmount()
    })
}

test('a cell with an ERROR span is drawn in the error red over the grey, at least half shaded', async ($) => {
    const ui = await mountStory($, 'components-charts-heatmap--default', 'terminal', 'dark')
    const red: any[] = (await ui.findAll({ type: 'Text' } as any)).filter((t: any) => t.props.color === '#e33238' && /^[▒▓█]+$/.test(t.text))
    expect(red.length).toBeGreaterThan(0)
    const grey: any[] = (await ui.findAll({ type: 'Text' } as any)).filter((t: any) => t.props.color === '#939396' && /^[░▒▓█]+$/.test(t.text))
    expect(grey.length).toBeGreaterThan(0)
    // The 2.5–10 s band's row ends red: 44 errors in the last step
    const drawn = JSON.stringify(await ui.drawn())
    const row = drawn.slice(drawn.indexOf('2.5 s ┤'), drawn.indexOf('500 ms ┤'))
    expect(row).toContain('#e33238')
    await ui.unmount()
})

test('shades run on a log scale: one span and the busiest cell both show', () => {
    expect(shadeOf(0, 60000)).toBe(0)
    expect(shadeOf(1, 60000)).toBe(1)
    expect(shadeOf(60000, 60000)).toBe(4)
    expect(shadeOf(1000, 60000)).toBe(2)
    expect(shadeOf(10000, 60000)).toBe(3)
    expect(shadeOf(40000, 60000)).toBe(4)
})

test('an empty heatmap draws empty cells and no max', async ($) => {
    const ui = await mountStory($, 'components-charts-heatmap--empty', 'terminal', 'dark')
    expect(await ui.findAll({ type: 'Text', text: 'no data' } as any)).toHaveLength(2)
    const texts: any[] = await ui.findAll({ type: 'Text' } as any)
    expect(texts.some(t => t.props.color === '#e33238' && /[░▒▓█]/.test(t.text))).toBe(false)
    await ui.unmount()
})
