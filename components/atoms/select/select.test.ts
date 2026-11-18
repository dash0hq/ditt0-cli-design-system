import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES.filter(s => s !== 'mobile')) {
    test(`picking an option calls onValueChange, and the select follows, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-inputs-select--default', surface)
        expect(await ui.find({ type: 'Select', key: 'dataset' } as any)).toMatchObject({ props: { label: 'Dataset', value: 'default' } })
        await ui.select({ key: 'dataset', value: 'staging-shared' } as any)
        expect(await ui.find({ type: 'Text', text: /Action: onValueChange\("staging-shared"\)/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Select', key: 'dataset' } as any)).toMatchObject({ props: { value: 'staging-shared' } })
        await ui.unmount()
    })

    test(`an option without a label shows its value on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-inputs-select--services', surface)
        const select: any = await ui.find({ type: 'Select', key: 'service' } as any)
        expect(select.props.options[0]).toMatchObject({ value: 'api', label: 'api' })
        await ui.unmount()
    })
}

test('on mobile, which draws no Select, every option is a press, the picked one bright', async ($) => {
    const ui = await mountStory($, 'components-inputs-select--default', 'mobile')
    expect(await ui.find({ type: 'Button', key: 'dataset-default' } as any)).toMatchObject({ props: { dimColor: false } })
    await ui.press({ key: 'dataset-staging-shared' })
    expect(await ui.find({ type: 'Text', text: /Action: onValueChange\("staging-shared"\)/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'dataset-staging-shared' } as any)).toMatchObject({ props: { dimColor: false } })
    expect(await ui.find({ type: 'Button', key: 'dataset-default' } as any)).toMatchObject({ props: { dimColor: true } })
    await ui.unmount()
})
