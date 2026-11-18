import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a warning banner draws its border and icon in the warning colour on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-banner--warning', surface, 'dark')
        const boxes: any[] = await ui.findAll({ type: 'Box', text: /span quota/ } as any)
        expect(boxes.find(b => b.props.borderStyle === 'round')).toMatchObject({ props: { borderColor: '#ffe54f' } })
        expect(await ui.find({ type: 'Text', text: '▲' } as any)).toMatchObject({ props: { color: '#ffe54f' } })
        await ui.press({ key: 'dismiss' })
        expect(await ui.find({ type: 'Text', text: /Action: onDismiss\(\)/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`an error banner's action runs, and a banner without onDismiss has no ✕, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-banner--load-error', surface)
        expect(await ui.find({ type: 'Button', key: 'dismiss' } as any)).toBeUndefined()
        await ui.press({ key: 'retry' })
        expect(await ui.find({ type: 'Text', text: /Action: onAction\("retry"\)/ } as any)).toBeDefined()
        await ui.unmount()
    })
}
