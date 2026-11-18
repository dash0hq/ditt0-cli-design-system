import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a legend draws a swatch in each series' colour beside its name on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-legend--default', surface, 'dark')
        const swatches: any[] = await ui.findAll({ type: 'Text', text: '━' } as any)
        expect(swatches.map(s => s.props.color)).toEqual(['#828aff', '#225584'])
        expect(await ui.find({ type: 'Text', text: 'p99' } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })

    test(`a legend shortens a long name in the middle on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-legend--many-series', surface)
        expect(await ui.find({ type: 'Text', text: 'gcp-warehous…asks-worker' } as any)).toBeDefined()
        await ui.unmount()
    })
}
