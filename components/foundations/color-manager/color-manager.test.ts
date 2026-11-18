import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'

const swatches = async (ui: any) =>
    (await ui.findAll({ type: 'Text', text: '    ' } as any)).map((t: any) => t.props.backgroundColor).filter(Boolean)

for (const surface of SURFACES) {
    test(`the auto palette is handed out in Dash0's order, and keeps it in a light theme, on ${surface}`, async ($) => {
        const dark = await mountStory($, 'foundations-colors-color-manager--default', surface, 'dark')
        expect((await swatches(dark)).slice(0, 4)).toEqual(['#828aff', '#225584', '#d8b4fe', '#b89d6a'])
        await dark.unmount()
        // series-0 keeps its slot, so in the light theme it takes the light colour of that slot
        const light = await mountStory($, 'foundations-colors-color-manager--default', surface, 'light')
        expect((await swatches(light)).slice(0, 4)).toEqual(['#4ca8a5', '#4038c0', '#b35b0a', '#7975f6'])
        await light.unmount()
    })

    test(`past nine series every auto colour is still different on ${surface}`, async ($) => {
        const ui = await mountStory($, 'foundations-colors-color-manager--default', surface, 'dark')
        const auto = (await swatches(ui)).slice(0, 40)
        expect(new Set(auto).size).toBe(40)
        await ui.unmount()
    })

    test(`attributes that mean something take their status colour on ${surface}`, async ($) => {
        const ui = await mountStory($, 'foundations-colors-color-manager--meaning', surface, 'dark')
        const hexes = await swatches(ui)
        // ERROR, 503, error.type: error red. WARN, 404: warning. INFO: info. OK: debug. 200, 201: seagull. UNSET: unknown
        expect(hexes.slice(0, 10)).toEqual(['#e33238', '#e33238', '#e33238', '#ffe54f', '#ffe54f', '#7eaacf', '#b9c8e0', '#5d6470', '#838e9e', '#939396'])
        // A label with no meaning falls back to the palette
        expect(['#e33238', '#ffe54f', '#7eaacf', '#b9c8e0', '#939396']).not.toContain(hexes[10])
        await ui.unmount()
    })
}
