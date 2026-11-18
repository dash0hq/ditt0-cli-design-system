import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`failed checks count each status in a Badge, list critical first with how long each has failed, and open Dash0 on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-status-failedchecks--default', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^ 8 critical $/ } as any)).toMatchObject({ props: { backgroundColor: '#e33238' } })
        expect(await ui.find({ type: 'Text', text: /^ 1 degraded $/ } as any)).toMatchObject({ props: { backgroundColor: '#ffe54f' } })
        const statuses: any[] = await ui.findAll({ type: 'Text', text: /^ (Critical|Degraded) $/ } as any)
        expect(statuses.map(t => t.text.trim())).toEqual([...new Array(8).fill('Critical'), 'Degraded'])
        expect(await ui.find({ type: 'Text', text: /^6m$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^9d 4h$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /Open in Dash0/ } as any)).toMatchObject({ props: { backgroundColor: '#7c3aed' } })
        await ui.unmount()
    })

    test(`with nothing failing, failed checks say all are passing on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-status-failedchecks--all-passing', surface)
        expect(await ui.find({ type: 'Text', text: /All checks passing\./ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^Status$/ } as any)).toBeUndefined()
        await ui.unmount()
    })
}
