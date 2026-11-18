import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a query result draws its series and links to the same query in Dash0 on ${surface}`, async ($) => {
        const ui = await mountStory($, 'features-dash0-pages-query-result--default', surface)
        expect(await ui.find({ type: 'Text', text: /[─╭╮╰╯\u2801-\u28ff]/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Link' } as any)).toMatchObject({ props: { label: 'Open in Dash0', href: expect.stringMatching(/^https:\/\/app\.dash0(-dev)?\.com\//) } })
        await ui.unmount()
    })

    test(`a query grouped by service names each series by it on ${surface}`, async ($) => {
        const ui = await mountStory($, 'features-dash0-pages-query-result--by-service', surface)
        expect(await ui.find({ type: 'Text', text: /product_catalog_sync/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a live result says when its data came, with the zone, and its switch turns refresh off, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'features-dash0-pages-query-result--live', surface)
        expect(await ui.find({ type: 'Text', text: /^Updated \d\d:\d\d:\d\d \((UTC|GMT[+-][\d:]+)\)$/ } as any)).toBeDefined()
        await ui.press({ key: 'auto-refresh-story' })
        expect(await ui.find({ type: 'Text', text: /^Snapshot · \d\d:\d\d \((UTC|GMT[+-][\d:]+)\)$/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a failed refresh keeps the chart and says which data it shows on ${surface}`, async ($) => {
        const ui = await mountStory($, 'features-dash0-pages-query-result--refresh-failed', surface)
        expect(await ui.find({ type: 'Text', text: /^Couldn't refresh\. Showing data from \d\d:\d\d:\d\d/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /[─╭╮╰╯\u2801-\u28ff]/ } as any)).toBeDefined()
        await ui.unmount()
    })
}
