import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`Dash0's logo draws its mark coral at the top, red at the foot, beside the dash0 wordmark, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-brand-logo--default', surface)
        const marks = (await ui.findAll({ type: 'Text' } as any)).filter((t: any) => /^#/.test(t.props.color ?? ''))
        expect(marks[0].props.color).toBe('#ff8a67')
        expect(marks[marks.length - 1].props.color).toBe('#fa4a4d')
        expect(await ui.find({ type: 'Text', text: /▄▀█/ } as any)).toBeDefined()
        await ui.unmount()
    })
}

test('Ditt0 is a Raster in the terminal, for a hooks module to animate, and glyphs elsewhere', async ($) => {
    const terminal = await mountStory($, 'components-brand-logo--ditt0', 'terminal')
    expect(await terminal.find({ type: 'Raster', key: 'ditt0-story' } as any)).toMatchObject({ props: { columns: 14, rows: 6 } })
    await terminal.unmount()
    const desktop = await mountStory($, 'components-brand-logo--ditt0', 'desktop')
    expect(await desktop.find({ type: 'Text', text: /████/ } as any)).toMatchObject({ props: { color: '#e15ff4' } })
    await desktop.unmount()
})
