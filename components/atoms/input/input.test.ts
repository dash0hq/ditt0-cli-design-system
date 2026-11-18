import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES.filter(s => s !== 'mobile')) {
    test(`typing into an input calls onChange, and Enter calls onSubmit, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-inputs-input--default', surface)
        expect(await ui.find({ type: 'Input', key: 'dashboard-name' } as any)).toMatchObject({ props: { label: 'Dashboard name' } })
        await ui.input({ key: 'dashboard-name', text: 'Checkout', kind: 'change' } as any)
        expect(await ui.find({ type: 'Text', text: /Action: onChange\("Checkout"\)/ } as any)).toBeDefined()
        await ui.input({ key: 'dashboard-name', text: 'Checkout' } as any)
        expect(await ui.find({ type: 'Text', text: /Action: onSubmit\("Checkout"\)/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`an optional field says so in its label, and an error is drawn under the field in the error colour, on ${surface}`, async ($) => {
        const optional = await mountStory($, 'components-inputs-input--optional', surface)
        expect(await optional.find({ type: 'Input', key: 'description' } as any)).toMatchObject({ props: { label: 'Description (optional)' } })
        await optional.unmount()
        const invalid = await mountStory($, 'components-inputs-input--invalid', surface, 'dark')
        expect(await invalid.find({ type: 'Text', text: 'Enter a name between 3 and 64 characters.' } as any)).toMatchObject({ props: { color: '#e33238' } })
        await invalid.unmount()
    })
}

test('on mobile, which draws no field, an input shows its label and its value, read only', async ($) => {
    const ui = await mountStory($, 'components-inputs-input--multiline', 'mobile')
    expect(await ui.find({ type: 'Input' } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'PromQL query' } as any)).toMatchObject({ props: { dimColor: true } })
    expect(await ui.find({ type: 'Text', text: /sum by \(service_name\)/ } as any)).toBeDefined()
    await ui.unmount()
})
