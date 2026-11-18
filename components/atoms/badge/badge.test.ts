import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a critical badge fills with Dash0's critical colour for each theme on ${surface}`, async ($) => {
        const dark = await mountStory($, 'components-feedback-badge--critical', surface, 'dark')
        expect(await dark.find({ type: 'Text', text: /Critical/ } as any)).toMatchObject({ props: { backgroundColor: '#e33238', color: '#ffe9e9' } })
        await dark.unmount()
        const light = await mountStory($, 'components-feedback-badge--critical', surface, 'light')
        expect(await light.find({ type: 'Text', text: /Critical/ } as any)).toMatchObject({ props: { backgroundColor: '#ff5e62' } })
        await light.unmount()
    })

    test(`a default badge is neutral on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-badge--default', surface)
        expect(await ui.find({ type: 'Text', text: /Beta/ } as any)).toMatchObject({ props: { backgroundColor: '#939396' } })
        await ui.unmount()
    })

    test(`a subtle badge draws its colour without a fill on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-badge--subtle', surface)
        const found: any = await ui.find({ type: 'Text', text: /Critical/ } as any)
        expect(found.props.color).toBe('#e33238')
        expect(found.props.backgroundColor).toBeUndefined()
        await ui.unmount()
    })
}
