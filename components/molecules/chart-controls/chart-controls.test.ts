import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a line chart's controls: Dots, Lines and Bars with their icons, the ranges, and − and + on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcontrols--default', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-braille' } as any)).toMatchObject({ props: { label: '⣀⡠⠊ Dots', dimColor: false } })
        expect(await ui.find({ type: 'Button', key: 'tab-box' } as any)).toMatchObject({ props: { label: '╭─╯ Lines', dimColor: true } })
        expect(await ui.find({ type: 'Button', key: 'tab-bars' } as any)).toMatchObject({ props: { label: '▁▃▅ Bars', dimColor: true } })
        await ui.press({ key: 'tab-box' })
        expect(await ui.find({ type: 'Button', key: 'tab-box' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Button', key: 'tab-24h' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Button', key: 'zoom-in' } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a bar chart's controls: Vertical and Horizontal, its own ranges, and no zoom on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcontrols--bar-chart', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-vertical' } as any)).toMatchObject({ props: { label: '▂▅▇ Vertical' } })
        await ui.press({ key: 'tab-horizontal' })
        expect(await ui.find({ type: 'Text', text: /Action: onOrientationChange\("horizontal"\)/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Button', key: 'tab-7d' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Button', key: 'zoom-in' } as any)).toBeUndefined()
        await ui.unmount()
    })

    test(`zoomed in, the span takes the ranges' place with Reset zoom, which brings them back, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcontrols--zoomed', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-zoom' } as any)).toMatchObject({ props: { label: '05:00–06:00' } })
        expect(await ui.find({ type: 'Button', key: 'tab-24h' } as any)).toBeUndefined()
        await ui.press({ key: 'reset-zoom' })
        expect(await ui.find({ type: 'Button', key: 'tab-24h' } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`ranges take any label on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcontrols--custom-ranges', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-28d' } as any)).toMatchObject({ props: { label: 'SLO window (28 days)', dimColor: false } })
        await ui.unmount()
    })
}
