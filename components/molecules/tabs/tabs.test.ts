import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`the open tab is drawn at full strength, the others dim, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-navigation-tabs--default', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-latency' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Button', key: 'tab-errors' } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })

    test(`tabs that don't fit wrap on to the next line on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-navigation-tabs--default', surface)
        const rows: any[] = await ui.findAll({ type: 'Box', text: /Latency/ } as any)
        expect(rows.some(b => b.props.flexDirection === 'row' && b.props.flexWrap === 'wrap')).toBe(true)
        await ui.unmount()
    })

    test(`pressing a tab calls onChange with its value on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-navigation-tabs--default', surface)
        await ui.press({ key: 'tab-errors' })
        expect(await ui.find({ type: 'Text', text: /Action: onChange\("errors"\)/ } as any)).toBeDefined()
        // The story keeps the value it was told, so the pressed tab opens
        expect(await ui.find({ type: 'Button', key: 'tab-errors' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Button', key: 'tab-latency' } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })

    test(`buttons tabs are bordered, the open one's border in the accent colour, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-navigation-tabs--buttons', surface)
        const borders: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.borderStyle === 'round')
        expect(borders.map(b => [b.props.borderColor === 'suggestion', b.props.borderDimColor])).toEqual([[true, false], [false, true], [false, true]])
        await ui.press({ key: 'tab-errors' })
        expect(await ui.find({ type: 'Button', key: 'tab-errors' } as any)).toMatchObject({ props: { dimColor: false } })
        await ui.unmount()
    })
}
