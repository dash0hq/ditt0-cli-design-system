import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a gauge fills its squares to the value in the colour of the threshold it reaches, ticking each threshold, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-gauge--thresholds', surface, 'dark')
        // 7.4 of 8 GB is 92.5%: 28 of 30 squares, past the error threshold
        expect(await ui.find({ type: 'Text', text: /^■{28}$/ } as any)).toMatchObject({ props: { color: '#e33238' } })
        expect(await ui.find({ type: 'Text', text: /^□□$/ } as any)).toMatchObject({ props: { dimColor: true } })
        expect(await ui.find({ type: 'Text', text: /^7.4 GB$/ } as any)).toMatchObject({ props: { color: '#e33238', bold: true } })
        const ticks: any[] = await ui.findAll({ type: 'Text', text: /^╵$/ } as any)
        expect(ticks.map(t => t.props.color)).toEqual(['#ffe54f', '#e33238'])
        expect(await ui.find({ type: 'Text', text: /^0 B +8 GB$/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a gauge without thresholds fills in CTA purple on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-gauge--default', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^■{13}$/ } as any)).toMatchObject({ props: { color: '#8b5cf6' } })
        expect(await ui.find({ type: 'Text', text: /^42%$/ } as any)).toBeDefined()
        await ui.unmount()
    })
}
