import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a switch is as tall as a Button: off, the knob left and grey; a press turns it on, the knob right and purple, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-inputs-switch--default', surface, 'dark')
        // The same rounded border as a Button, in its stroke
        const frames: any[] = await ui.findAll({ type: 'Box', borderStyle: 'round', text: /Auto-refresh/ } as any)
        expect(frames.some(b => b.props.borderColor === '#414144' && b.props.paddingX === 1 && !b.props.backgroundColor)).toBe(true)
        const off: any[] = await ui.findAll({ type: 'Text', text: '██' } as any)
        expect(off.map(t => t.props.color)).toEqual(['#939396', '#414144'])
        // Its colour on its colour, so the pointer's inversion keeps it
        expect(off.every(t => t.props.backgroundColor === t.props.color)).toBe(true)
        await ui.press({ key: 'Auto-refresh' })
        expect(await ui.find({ type: 'Text', text: /Action: onCheckedChange\(true\)/ } as any)).toBeDefined()
        const on: any[] = await ui.findAll({ type: 'Text', text: '██' } as any)
        expect(on.map(t => t.props.color)).toEqual(['#414144', '#8b5cf6'])
        await ui.unmount()
    })

    test(`a disabled switch is dim and a press changes nothing on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-inputs-switch--disabled', surface)
        await ui.press({ key: 'Live tail' })
        expect(await ui.find({ type: 'Text', text: /Action: onCheckedChange/ } as any)).toBeUndefined()
        expect(await ui.find({ type: 'Button', key: 'Live tail' } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })
}
