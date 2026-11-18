import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a row box lays its children side by side on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-layout-box--row', surface)
        const boxes: any[] = await ui.findAll({ type: 'Box', text: /Critical/ } as any)
        expect(boxes.some(b => b.props.flexDirection === 'row' && b.props.gap === 1)).toBe(true)
        expect(await ui.find({ type: 'Text', text: /checkout-service/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a bordered box draws a dim rounded border on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-layout-box--bordered', surface)
        const boxes: any[] = await ui.findAll({ type: 'Box', text: /api/ } as any)
        expect(boxes.some(b => b.props.borderStyle === 'round' && b.props.borderDimColor === true)).toBe(true)
        await ui.unmount()
    })
}
