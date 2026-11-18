import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a series table has a row per series, highest current first, a swatch in its colour and its figures in one unit on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-seriestable--latency', surface, 'dark')
        const names: any[] = await ui.findAll({ type: 'Text', text: /^p\d\d$/ } as any)
        expect(names.map(t => t.text)).toEqual(['p99', 'p95', 'p50'])
        expect((await ui.findAll({ type: 'Text', text: /^━━$/ } as any)).length).toBe(3)
        // p50 stays in ms beside the others: 0.64 ms, not 640 μs
        expect(await ui.find({ type: 'Text', text: /^0.64 ms$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^547 ms$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^Max$/ } as any)).toMatchObject({ props: { bold: true } })
        await ui.unmount()
    })
}
