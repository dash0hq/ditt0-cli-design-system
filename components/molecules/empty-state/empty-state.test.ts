import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a first-time empty state has no title, the CTA Send telemetry to Dash0 and the setup links, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-emptystate--first-time', surface)
        const texts: any[] = await ui.findAll({ type: 'Text' } as any)
        expect(texts.some(t => t.props.bold && !/Send telemetry/.test(t.text))).toBe(false)
        await ui.press({ key: 'send-telemetry' })
        expect(await ui.find({ type: 'Text', text: /Action: onAction\("send-telemetry"\)/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Link', text: /Get help with setup/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a no-results state names what matched nothing and offers to clear it on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-emptystate--default', surface)
        expect(await ui.find({ type: 'Text', text: 'No logs match these filters' } as any)).toMatchObject({ props: { bold: true } })
        await ui.press({ key: 'clear-filters' })
        expect(await ui.find({ type: 'Text', text: /Action: onAction\("clear-filters"\)/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a load error is drawn in the error colour, not as a first-time state, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-emptystate--load-error', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: '✖' } as any)).toMatchObject({ props: { color: '#e33238' } })
        expect(await ui.find({ type: 'Button', key: 'send-telemetry' } as any)).toBeUndefined()
        await ui.unmount()
    })
}
