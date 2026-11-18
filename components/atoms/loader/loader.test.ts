import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

for (const surface of SURFACES) {
    test(`a loader draws its first frame in the CTA purple, then what is loading, dim, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-loader--default', surface, 'dark')
        const client = await ui.find({ type: 'Client' } as any)
        // Mobile draws no Client: the glyph stands still
        expect(Boolean(client)).toBe(surface !== 'mobile')
        const scope = client ? { in: client.props.key } : {}
        const texts: any[] = await ui.findAll({ type: 'Text', ...scope } as any)
        expect(texts.find(t => t.text === '⠋' && t.props.color)).toMatchObject({ props: { color: '#8b5cf6' } })
        expect(texts.find(t => t.text === ' Loading from Dash0…')).toMatchObject({ props: { dimColor: true } })
        await ui.unmount()
    })

    test(`a pulse is a square in the CTA purple, fading toward the page, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-feedback-loader--pulse', surface, 'dark')
        const client = await ui.find({ type: 'Client' } as any)
        if (client) expect(client.props.props.colors).toHaveLength(6)
        expect(await ui.find({ type: 'Text', text: '▪', ...(client ? { in: client.props.key } : {}) } as any)).toBeDefined()
        await ui.unmount()
    })
}

test('a loader moves: each tick of the frame clock draws the next frame, round and round', async ($) => {
    const ui = await mountStory($, 'components-feedback-loader--default', 'terminal', 'dark')
    const key = (await ui.find({ type: 'Client' } as any)).props.key
    const glyph = async () => (await ui.findAll({ type: 'Text', in: key } as any)).find((t: any) => t.props.color)?.text
    const seen = [await glyph()]
    for (let i = 0; i < 11; i++) {
        await ui.advance(80)
        seen.push(await glyph())
    }
    expect(seen).toEqual(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏', '⠋', '⠙'])
    await ui.unmount()
})
