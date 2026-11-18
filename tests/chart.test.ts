import { test, expect } from 'claude-code/testing'

const PANE = { component: 'Pane', requestId: 'hello-tabs', props: { title: 'Hello tabs', isFocused: true } } as const

for (const surface of ['terminal', 'desktop'] as const) {
    test(`tab two draws the chart on ${surface}`, async ($) => {
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...PANE } as any)
        await ui.press({ key: 'tab-two' })
        console.log(surface, JSON.stringify(await ui.drawn()).slice(0, 1500))
        const found = await ui.find({ type: surface === 'desktop' ? 'Svg' : 'Text', text: surface === 'desktop' ? undefined : /█/ } as any)
        expect(found).toBeDefined()
        await ui.unmount()
    })

    test(`tab three draws the time series on ${surface}`, async ($) => {
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...PANE } as any)
        await ui.press({ key: 'tab-three' })
        const found = await ui.find({ type: 'Text', text: /[─╭╮╰╯\u2801-\u28ff]/ } as any)
        expect(found).toBeDefined()
        await ui.unmount()
    })

    test(`tab four draws the request rates on ${surface}`, async ($) => {
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...PANE } as any)
        await ui.press({ key: 'tab-four' })
        const found = await ui.find({ type: 'Text', text: /order-history-api/ } as any)
        expect(found).toBeDefined()
        await ui.unmount()
    })

    test(`tab five draws the 24h stress series on ${surface}`, async ($) => {
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...PANE } as any)
        await ui.press({ key: 'tab-five' })
        const found = await ui.find({ type: 'Text', text: /image-resizer-api/ } as any)
        expect(found).toBeDefined()
        await ui.unmount()
    })

    test(`tab six draws the overlapping series on ${surface}`, async ($) => {
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...PANE } as any)
        await ui.press({ key: 'tab-six' })
        const found = await ui.find({ type: 'Text', text: /gcp-warehouse-sync-tasks-worker/ } as any)
        expect(found).toBeDefined()
        await ui.unmount()
    })
}
