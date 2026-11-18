import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a progress bar fills its share in half cells in the CTA purple, then says the percent, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-progress--default', surface, 'dark')
        // 62% of 20 cells is 12.4, drawn as 12 cells and a half
        const texts: any[] = await ui.findAll({ type: 'Text' } as any)
        expect(texts.find(t => t.text === '━━━━━━━━━━━━╸')).toMatchObject({ props: { color: '#8b5cf6' } })
        expect(texts.find(t => t.text === '━━━━━━━')).toMatchObject({ props: { dimColor: true } })
        expect(await ui.find({ type: 'Text', text: / 62%/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a progress bar takes the colour of the status it is given on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-progress--critical', surface, 'dark')
        const texts: any[] = await ui.findAll({ type: 'Text' } as any)
        expect(texts.find(t => /^━+╸?$/.test(t.text) && t.props.color)).toMatchObject({ props: { color: '#e33238' } })
        await ui.unmount()
    })
}
