import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`subtle text is drawn dim on ${surface}`, async ($) => {
        const ui = await mountStory($, 'foundations-text--subtle', surface)
        expect(await ui.find({ type: 'Text', text: /last 30 minutes/ } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })

    test(`intense text is bold in the theme's own colour on ${surface}`, async ($) => {
        const ui = await mountStory($, 'foundations-text--intense', surface)
        const found: any = await ui.find({ type: 'Text', text: /order-history-api/ } as any)
        expect(found.props.weight).toBe('bold')
        expect(found.props.color).toBeUndefined()
        await ui.unmount()
    })

    test(`error text takes Dash0's error colour for each theme on ${surface}`, async ($) => {
        const dark = await mountStory($, 'foundations-text--error-color', surface, 'dark')
        expect(await dark.find({ type: 'Text', text: /Check rule failed/ } as any)).toMatchObject({ props: { color: '#e33238' } })
        await dark.unmount()
        const light = await mountStory($, 'foundations-text--error-color', surface, 'light')
        expect(await light.find({ type: 'Text', text: /Check rule failed/ } as any)).toMatchObject({ props: { color: '#e33238' } })
        await light.unmount()
    })
}
