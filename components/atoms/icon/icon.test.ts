import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'
import { ICONS } from './icon.jsx'

for (const surface of SURFACES) {
    test(`an icon draws its glyph in its status' inline colour for each theme on ${surface}`, async ($) => {
        const dark = await mountStory($, 'foundations-icons--default', surface, 'dark')
        expect(await dark.find({ type: 'Text', text: '✓' } as any)).toMatchObject({ props: { color: '#48b78c' } })
        await dark.unmount()
        const light = await mountStory($, 'foundations-icons--default', surface, 'light')
        expect(await light.find({ type: 'Text', text: '✓' } as any)).toMatchObject({ props: { color: '#389e77' } })
        await light.unmount()
    })

    test(`a subtle icon is dim, without a colour, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'foundations-icons--subtle', surface)
        const found: any = await ui.find({ type: 'Text', text: '▸' } as any)
        expect(found.props.dimColor).toBe(true)
        expect(found.props.color).toBeUndefined()
        await ui.unmount()
    })

    test(`the All story draws every icon beside its name on ${surface}`, async ($) => {
        const ui = await mountStory($, 'foundations-icons--all', surface)
        for (const [name, glyph] of Object.entries(ICONS)) {
            expect(await ui.find({ type: 'Text', text: name } as any)).toBeDefined()
            expect(await ui.find({ type: 'Text', text: glyph } as any)).toBeDefined()
        }
        await ui.unmount()
    })
}
