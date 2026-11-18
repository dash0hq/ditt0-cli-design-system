import { test, expect } from 'claude-code/testing'
import { mountStory, watchCopies, SURFACES } from '../../../tests/story.ts'
import { markdownTable, plainText } from '../../copy.js'

for (const surface of SURFACES) {
    test(`Copy markdown puts the markdown on the clipboard and toasts Copied on ${surface}`, async ($, on) => {
        const { copied, toasts } = watchCopies(on)
        const ui = await mountStory($, 'components-actions-copybuttons--default', surface)
        await ui.press({ key: 'copy-markdown' })
        expect(copied).toEqual(['| Service | Requests |\n| --- | ---: |\n| api | 1120/s |\n| order-history-api | 70.7/s |'])
        expect(toasts).toEqual(['Copied'])
        await ui.press({ key: 'copy-text' })
        expect(copied[1]).toMatch(/^Service +Requests\n─+\napi +1120\/s/)
        await ui.unmount()
    })
}

test('a clipboard that takes nothing says why in the toast', async ($, on) => {
    const { toasts } = watchCopies(on, false)
    const ui = await mountStory($, 'components-actions-copybuttons--default', 'terminal')
    await ui.press({ key: 'copy-markdown' })
    expect(toasts).toEqual(["Couldn't copy: this terminal has no clipboard Claude Code can reach"])
    await ui.unmount()
})

test('a button with nothing to copy is left out', async ($) => {
    const ui = await mountStory($, 'components-actions-copybuttons--markdown-only', 'terminal')
    expect(await ui.find({ key: 'copy-markdown' } as any)).toBeDefined()
    expect(await ui.find({ key: 'copy-text' } as any)).toBeUndefined()
    await ui.unmount()
})

test('a markdown table escapes pipes and aligns right-aligned columns right; plain text has no escapes', () => {
    expect(markdownTable([{ key: 'a', label: 'A' }, { key: 'b', label: 'B', align: 'right' }], [{ a: 'x | y', b: { text: '3', badge: 'critical' } }]))
        .toBe('| A | B |\n| --- | ---: |\n| x \\| y | 3 |')
    expect(plainText('\x1b[38;2;1;2;3mapi\x1b[0m   \nok')).toBe('api\nok')
})
