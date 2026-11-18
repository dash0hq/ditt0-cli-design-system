import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`services list busiest first with a health Badge, request rate, errors and p95 in one unit on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-status-services--default', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^ Critical $/ } as any)).toMatchObject({ props: { backgroundColor: '#e33238' } })
        expect((await ui.findAll({ type: 'Text', text: /^ Healthy $/ } as any)).length).toBe(13)
        expect(await ui.find({ type: 'Text', text: /^9627\/s$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^<0.01%$/ } as any)).toBeDefined()
        // Most p95s are in ms, so the 4-minute outlier is too (UNIT-002)
        expect(await ui.find({ type: 'Text', text: /^239590 ms$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /Open in Dash0/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`services without Dash0's health take it from their error rate on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-status-services--from-error-rate', surface, 'dark')
        expect((await ui.findAll({ type: 'Text', text: /^ Critical $/ } as any)).length).toBe(1)
        expect((await ui.findAll({ type: 'Text', text: /^ Degraded $/ } as any)).length).toBe(1)
        await ui.unmount()
    })
}
