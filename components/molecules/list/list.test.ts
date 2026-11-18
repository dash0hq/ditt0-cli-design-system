import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a list row draws its status dot in the status colour, its description dim and its meta, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-list--default', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: '●' } as any)).toMatchObject({ props: { color: '#e33238' } })
        expect(await ui.find({ type: 'Text', text: 'staging-shared' } as any)).toMatchObject({ props: { dimColor: true } })
        expect(await ui.find({ type: 'Text', text: '1.2K req/s' } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`pressing a row calls onSelect, and the row is marked selected, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-list--default', surface, 'dark')
        await ui.press({ key: 'item-ui' })
        expect(await ui.find({ type: 'Text', text: /Action: onSelect\("ui"\)/ } as any)).toBeDefined()
        const texts: any[] = await ui.findAll({ type: 'Text' } as any)
        expect(texts.find(t => t.text === 'ui' && t.props.bold)).toBeDefined()
        expect(texts.find(t => t.text === 'api')?.props.bold).toBeUndefined()
        expect(await ui.find({ type: 'Text', text: '▌' } as any)).toMatchObject({ props: { color: '#8b5cf6' } })
        await ui.unmount()
    })

    test(`a read-only list has no presses on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-data-list--read-only', surface)
        expect(await ui.find({ type: 'Button', key: 'item-p95' } as any)).toBeUndefined()
        expect(await ui.find({ type: 'Text', text: '412 ms' } as any)).toBeDefined()
        await ui.unmount()
    })
}
