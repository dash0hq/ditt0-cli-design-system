import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`pressing a button runs its onClick on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-actions-button--default', surface)
        await ui.press({ key: 'Open in Dash0' })
        expect(await ui.find({ type: 'Text', text: /Action: onClick\(\)/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`the hierarchy: the main action filled purple, a secondary outlined, a tertiary its label alone, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-actions-button--hierarchy', surface, 'dark')
        const borders: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.borderStyle === 'round')
        expect(borders.map(b => [b.props.borderColor, b.props.backgroundColor ?? null])).toEqual([['#7c3aed', '#7c3aed'], ['#414144', null]])
        expect(await ui.find({ type: 'Text', text: 'Create check rule' } as any)).toMatchObject({ props: { color: '#f5f3ff' } })
        expect(await ui.find({ type: 'Button', key: 'Show 22 more series' } as any)).toMatchObject({ props: { plain: true } })
        await ui.unmount()
    })

    test(`toggles are outlined, the selected one's border the accent, the others dim, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-actions-button--toggles', surface)
        const borders: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.borderStyle === 'round')
        expect(borders.map(b => [b.props.borderColor === 'suggestion', b.props.borderDimColor])).toEqual([[false, true], [true, false], [false, true]])
        expect(await ui.find({ type: 'Button', key: '1h' } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })

    test(`a destructive button draws its label in Dash0's error colour on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-actions-button--destructive', surface)
        expect(await ui.find({ type: 'Text', text: /Delete dashboard/ } as any)).toMatchObject({ props: { color: '#e33238' } })
        await ui.unmount()
    })

    test(`a transparent button is drawn without chrome on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-actions-button--transparent', surface)
        expect(await ui.find({ type: 'Button', key: 'Show 22 more series' } as any)).toMatchObject({ props: { plain: true } })
        await ui.unmount()
    })
}
