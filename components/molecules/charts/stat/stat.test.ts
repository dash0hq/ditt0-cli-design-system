import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a stat draws its value in digits three rows tall, the unit beside, the change and a sparkline on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-stat--default', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^╻ ╻ ┏━┓ ┏━╸$/ } as any)).toMatchObject({ props: { bold: true } })
        expect(await ui.find({ type: 'Text', text: /^\/s$/ } as any)).toBeDefined()
        // Requests fell: down is bad by default, so red
        expect(await ui.find({ type: 'Text', text: /^▼ 3.1%$/ } as any)).toMatchObject({ props: { color: '#e33238' } })
        expect(await ui.find({ type: 'Text', text: /^ vs 24h ago$/ } as any)).toMatchObject({ props: { dimColor: true } })
        expect(await ui.find({ type: 'Text', text: /^[▁▂▃▄▅▆▇█]{30}$/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a stat past a threshold takes its colour, and a fall in latency is green on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-stat--thresholds', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^ms$/ } as any)).toMatchObject({ props: { color: '#ffe54f' } })
        expect(await ui.find({ type: 'Text', text: /^▼ 7.17%$/ } as any)).toMatchObject({ props: { color: '#48b78c' } })
        await ui.unmount()
    })

    test(`a small stat is one bold line, and a missing value says no data on ${surface}`, async ($) => {
        const row = await mountStory($, 'components-charts-stat--row', surface)
        expect(await row.find({ type: 'Text', text: /^9627\/s$/ } as any)).toMatchObject({ props: { bold: true } })
        await row.unmount()
        const none = await mountStory($, 'components-charts-stat--no-data', surface)
        expect(await none.find({ type: 'Text', text: /^no data$/ } as any)).toMatchObject({ props: { dimColor: true } })
        await none.unmount()
    })
}
