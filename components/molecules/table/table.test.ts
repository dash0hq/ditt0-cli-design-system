import { test, expect } from 'claude-code/testing'
import { mountStory, clientKey, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a table's header is bold over a rule, its columns sharing the width, numbers right, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-table--default', surface)
        expect(await ui.find({ type: 'Text', text: /^Service$/ } as any)).toMatchObject({ props: { bold: true } })
        expect(await ui.find({ type: 'Text', text: /^─+$/ } as any)).toMatchObject({ props: { dimColor: true } })
        expect(await ui.find({ type: 'Text', text: /^gcp-warehouse-sync-tasks-worker$/ } as any)).toMatchObject({ props: { wrap: 'truncate-end' } })
        const cells: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => /%$/.test(String(b.props.width)))
        expect(cells.some((b: any) => b.props.justifyContent === 'flex-end')).toBe(true)
        await ui.unmount()
    })

    test(`a wrapped table wraps its cells, draws code in the accent, and rules its rows on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-table--wrapped', surface)
        expect(await ui.find({ type: 'Text', text: /^Adds − and \+/ } as any)).toMatchObject({ props: { wrap: 'wrap' } })
        expect((await ui.findAll({ type: 'Text', text: /^addZoomControl$/ } as any)).some((t: any) => t.props.color === 'suggestion')).toBe(true)
        expect((await ui.findAll({ type: 'Text', text: /^┄+$/ } as any)).length).toBe(2)
        await ui.unmount()
    })
}

test('in a narrow Box the numbers stay whole and the service names are cut', async ($) => {
    const ui = await mountStory($, 'components-data-table--default', 'terminal')
    await ui.resize({ columns: 50, rows: 20, in: await clientKey(ui) })
    const boxes: any[] = await ui.findAll({ type: 'Box' } as any)
    const cell = (text: RegExp) => boxes.find((b: any) => typeof b.props.width === 'number' && text.test(b.text ?? ''))
    // Every number with its space, never cut
    const numbers = boxes.filter((b: any) => typeof b.props.width === 'number' && b.props.justifyContent === 'flex-end')
    expect(numbers.length).toBeGreaterThan(12)
    expect(numbers.filter((b: any) => b.props.width < String(b.text ?? '').length + 1)).toEqual([])
    const name = cell(/^gcp-warehouse-sync-tasks-worker$/)
    expect(name?.props.width).toBeLessThan(32)
    const widths = boxes.filter((b: any) => b.props.paddingRight === 1 && typeof b.props.width === 'number').slice(0, 4).map((b: any) => b.props.width)
    expect(widths.reduce((a: number, w: number) => a + w, 0)).toBeLessThanOrEqual(50)
    await ui.unmount()
})
