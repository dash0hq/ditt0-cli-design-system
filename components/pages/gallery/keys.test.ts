import { test, expect } from 'claude-code/testing'
import { COMPONENTS } from './stories.js'

const GALLERY = { plugin: 'ditt0-cli-design-system', component: 'Pane', requestId: 'ditt0', props: { title: 'Ditt0 components', isFocused: true } } as const

// Every story of a component draws on its one page, so the page must draw: no two stories keying a control the
// same, and no page past the engine's node limit. Every page mounted one after another: longer than a test's usual 5 s
for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    test(`every component's page draws, on ${surface}`, { timeoutMs: 20000 }, async ($) => {
        const problems: string[] = []
        // The gallery keeps the open component, so a page that can't draw fails the next mount: name it then
        let last = ''
        for (const c of COMPONENTS) {
            let ui: any
            try { ui = await $.ui.mount({ ...GALLERY, surface } as any) } catch (err: any) {
                problems.push(`${last}: ${String(err?.message ?? err).split('\n')[0]}`)
                break
            }
            last = c.id
            try {
                await ui.press({ key: surface === 'mobile' ? `component-${c.id}` : `nav-${c.id}` })
                for (let i = 0; i < 30 && (await ui.find({ type: 'Client', key: 'docs-loading' } as any)); i++) await new Promise(r => setTimeout(r, 10))
                await ui.find({ type: 'Box' } as any)
            } catch (err: any) {
                problems.push(`${c.id}: ${String(err?.message ?? err).split('\n')[0]}`)
            }
            await ui.unmount().catch(() => {})
        }
        expect(problems).toEqual([])
    })
}
