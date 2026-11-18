import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`hello tabs opens on the tab it is given on ${surface}`, async ($) => {
        const ui = await mountStory($, 'features-hello-tabs-pages-hello-tabs--latency', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-three' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Text', text: /api latency/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`hello tabs asks for a tab change and a count, and leaves the state to its caller, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'features-hello-tabs-pages-hello-tabs--counter', surface)
        expect(await ui.find({ type: 'Text', text: /Count: 3/ } as any)).toBeDefined()
        await ui.press({ key: 'tab-more' })
        expect(await ui.find({ type: 'Text', text: /Action: onCount\(\)/ } as any)).toBeDefined()
        await ui.press({ key: 'tab-four' })
        expect(await ui.find({ type: 'Text', text: /Action: onTabChange\("four"\)/ } as any)).toBeDefined()
        await ui.unmount()
    })
}
