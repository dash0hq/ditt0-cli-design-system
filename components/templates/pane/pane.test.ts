import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a pane stacks nav, body and a dim footer with a line between on ${surface}`, async ($) => {
        const ui = await mountStory($, 'templates-claude-code-pane--default', surface)
        const columns: any[] = await ui.findAll({ type: 'Box', text: /nav: tabs/ } as any)
        expect(columns.some(b => b.props.flexDirection === 'column' && b.props.gap === 1 && b.children.length === 3)).toBe(true)
        expect(await ui.find({ type: 'Text', text: /footer: a hint/ } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })
}
