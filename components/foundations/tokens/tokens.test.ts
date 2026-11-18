import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`status colours switch to Dash0's light set in a light theme on ${surface}`, async ($) => {
        const dark = await mountStory($, 'foundations-colors--default', surface, 'dark')
        expect(await dark.find({ type: 'Text', text: '#e33238' } as any)).toBeDefined()
        await dark.unmount()
        const light = await mountStory($, 'foundations-colors--default', surface, 'light')
        expect(await light.find({ type: 'Text', text: '#ff3d44' } as any)).toBeDefined()
        expect(await light.find({ type: 'Text', text: '#e33238' } as any)).toBeUndefined()
        await light.unmount()
    })

    test(`the chart palette keeps Dash0's order on ${surface}`, async ($) => {
        const ui = await mountStory($, 'foundations-colors--chart-palette', surface, 'dark')
        const hexes = (await ui.findAll({ type: 'Text', text: /^#[0-9a-f]{6}$/ } as any)).map((t: any) => t.text ?? t.children?.[0])
        expect(hexes.slice(0, 3)).toEqual(['#828aff', '#225584', '#829ed6'])
        await ui.unmount()
    })
}
