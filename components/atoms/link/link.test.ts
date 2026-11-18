import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a link carries its address and label on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-navigation-link--default', surface)
        expect(await ui.find({ type: 'Link' } as any)).toMatchObject({ props: { label: 'Open in Dash0', href: expect.stringMatching(/^https:\/\/app\.dash0\.com\//) } })
        await ui.unmount()
    })
}

for (const surface of SURFACES) {
    test(`a cta link is filled in Dash0's CTA purple, its label and ↗ in the CTA ink, in a CTA Button's frame, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-navigation-link--cta', surface, 'dark')
        expect(await ui.find({ type: 'Link' } as any)).toMatchObject({ props: { label: 'Open in Dash0' } })
        expect(await ui.find({ type: 'Text', text: 'Open in Dash0 ↗' } as any)).toMatchObject({ props: { backgroundColor: '#7c3aed', color: '#f5f3ff' } })
        const frames: any[] = await ui.findAll({ type: 'Box', borderStyle: 'round' } as any)
        expect(frames.some(b => b.props.borderColor === '#7c3aed' && b.props.backgroundColor === '#7c3aed')).toBe(true)
        await ui.unmount()
    })
}
