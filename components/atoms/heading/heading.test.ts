import { test, expect } from 'claude-code/testing'
import { mountStory } from '../../../tests/story.ts'
import { pixels, FONTS } from './font.js'

const pixelLines = async (ui: any) => (await ui.findAll({ type: 'Text' } as any)).filter((t: any) => /[▀▄█]/.test(t.text ?? t.props.children?.join?.('') ?? ''))

// Each level draws its own pixel font, a line of words as tall as the font
for (const [level, lines] of [['h1', 6], ['h2', 4], ['h3', 3]] as const) {
    test(`an ${level} title draws in its pixel font, ${lines} lines tall, in the terminal`, async ($) => {
        const ui = await mountStory($, `components-typography-heading--${level}`, 'terminal')
        // Services has no descender: its last line is blank, drawn as a space
        const texts: any[] = (await ui.findAll({ type: 'Text' } as any)).filter((t: any) => t.props.wrap === 'truncate-end')
        expect(texts.length).toBe(lines)
        await ui.unmount()
    })
}

test('each level is smaller than the one above it', async () => {
    const width = (level: 'h1' | 'h2' | 'h3') => pixels('Services', FONTS[level])[0].length
    expect(width('h1')).toBeGreaterThan(width('h2'))
    expect(width('h2')).toBeGreaterThan(width('h3'))
    expect([FONTS.h1, FONTS.h2, FONTS.h3].map(f => f.A.length)).toEqual([11, 8, 6])
})

test('title is h1', async ($) => {
    const ui = await mountStory($, 'components-typography-heading--default', 'terminal')
    expect((await ui.findAll({ type: 'Text' } as any)).filter((t: any) => t.props.wrap === 'truncate-end').length).toBe(6)
    await ui.unmount()
})

test('a title too wide for one line puts its next word under it, each line as wide as fits', async ($) => {
    const ui = await mountStory($, 'components-typography-heading--long', 'terminal')
    const lines = await pixelLines(ui)
    // Services, then Overview under it: two h1 lines, the second's last line blank
    expect(lines.length).toBe(10)
    expect(Math.max(...lines.map((t: any) => t.text.length))).toBeLessThanOrEqual(72)
    await ui.unmount()
})

test('every font has upper and lower case, and h1 has stems two pixels wide', async () => {
    for (const font of Object.values(FONTS)) expect(pixels('a', font)).not.toEqual(pixels('A', font))
    expect(pixels('a')).not.toEqual(pixels('A'))
    // l is one stem, two pixels wide, nine tall
    expect(pixels('l').filter((r: string) => r === '##').length).toBe(9)
    // g descends below the baseline
    expect(pixels('g')[10]).toMatch(/#/)
})

test('a title takes the surface title size where there are sizes', async ($) => {
    const ui = await mountStory($, 'components-typography-heading--default', 'desktop')
    expect(await ui.find({ type: 'Text', text: 'Services' } as any)).toMatchObject({ props: { size: 'title', bold: true } })
    await ui.unmount()
})

test('a section heading is bold text', async ($) => {
    const ui = await mountStory($, 'components-typography-heading--section', 'terminal')
    expect(await ui.find({ type: 'Text', text: 'Failed checks' } as any)).toMatchObject({ props: { bold: true } })
    await ui.unmount()
})
