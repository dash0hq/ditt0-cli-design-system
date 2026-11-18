import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a closed collapsible shows ▸ and its title, and a press opens it, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-layout-collapsible--default', surface)
        expect(await ui.find({ type: 'Text', text: '▸' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /http\.route/ } as any)).toBeUndefined()
        await ui.press({ key: 'Span attributes' })
        expect(await ui.find({ type: 'Text', text: /Action: onOpenChange\(true\)/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: '▾' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /http\.route/ } as any)).toBeDefined()
        await ui.unmount()
    })
}
