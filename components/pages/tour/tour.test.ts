import { test, expect, mock } from 'claude-code/testing'

const TOUR = { plugin: 'ditt0-cli-design-system', component: 'Pane', requestId: 'ditt0-tour', props: { title: 'Ditt0 tour', isFocused: true } } as const

test('/book-tour opens the tour at its start, and Next and Previous step through it', async ($) => {
    await $.command.run({ command: 'book-tour', args: '' } as any).catch(() => undefined)
    const ui = await $.ui.mount({ ...TOUR, surface: 'terminal' } as any)
    expect(await ui.find({ type: 'Text', text: /^1 of \d+$/ } as any)).toBeDefined()
    await ui.press({ key: 'tour-next' })
    expect(await ui.find({ type: 'Text', text: /^2 of \d+$/ } as any)).toBeDefined()
    await ui.press({ key: 'tour-previous' })
    expect(await ui.find({ type: 'Text', text: /^1 of \d+$/ } as any)).toBeDefined()
    await ui.unmount()
})

for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    test(`every step of the tour draws on ${surface}`, async ($) => {
        const ui = await $.ui.mount({ ...TOUR, surface } as any)
        const total = Number((await ui.find({ type: 'Text', text: /^\d+ of \d+$/ } as any)).text.split(' of ')[1])
        for (let i = 1; i < total; i++) await ui.press({ key: 'tour-next' })
        expect(await ui.find({ type: 'Text', text: new RegExp(`^${total} of ${total}$`) } as any)).toBeDefined()
        await ui.unmount()
    })
}
