import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a tool result with only a body draws no notice and no actions row on ${surface}`, async ($) => {
        const ui = await mountStory($, 'templates-claude-code-tool-result--default', surface)
        expect(await ui.find({ type: 'Text', text: /body: what the call found/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /notice:/ } as any)).toBeUndefined()
        expect(await ui.find({ type: 'Text', text: /\[ action \]/ } as any)).toBeUndefined()
        await ui.unmount()
    })

    test(`a tool result draws its notice dim and its actions in a row, under the body, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'templates-claude-code-tool-result--with-notice-and-actions', surface)
        expect(await ui.find({ type: 'Text', text: /notice:/ } as any)).toMatchObject({ props: { dimColor: true } })
        const rows: any[] = await ui.findAll({ type: 'Box', text: /\[ action \]/ } as any)
        expect(rows.some(b => b.props.flexDirection === 'row' && b.children.length === 2)).toBe(true)
        await ui.unmount()
    })
}
