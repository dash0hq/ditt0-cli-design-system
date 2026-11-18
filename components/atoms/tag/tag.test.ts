import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a tag draws its key and operator dim and its value at full strength, on level 2's fill, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-tag--default', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: 'service.name' } as any)).toMatchObject({ props: { dimColor: true } })
        expect((await ui.find({ type: 'Text', text: 'api' } as any) as any).props.dimColor).toBeUndefined()
        const boxes: any[] = await ui.findAll({ type: 'Box', text: /service\.name/ } as any)
        expect(boxes.some(b => b.props.backgroundColor === '#414144')).toBe(true)
        expect(await ui.find({ type: 'Button', key: 'remove-service.name' } as any)).toBeUndefined()
        await ui.unmount()
    })

    test(`a removable tag's ✕ calls onRemove on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-tag--removable', surface)
        await ui.press({ key: 'remove-service.name' })
        expect(await ui.find({ type: 'Text', text: /Action: onRemove\(\)/ } as any)).toBeDefined()
        await ui.unmount()
    })
}
