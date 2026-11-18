import { test, expect } from 'claude-code/testing'
import { mountStory, clientKey } from '../../../tests/story.ts'

const ID = 'templates-claude-code-chart-grid--default'
// The cells: the Boxes given a width, one per chart
const cells = async (ui: any) => (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => Number.isInteger(b.props.width) && b.props.flexDirection === 'column' && !b.props.position && !b.props.borderStyle)

test('a pane one chart wide stacks the charts, each as wide as the pane', async ($) => {
    const ui = await mountStory($, ID, 'terminal')
    await ui.resize({ columns: 60, rows: 4, in: await clientKey(ui) })
    const widths = (await cells(ui)).map((b: any) => b.props.width)
    expect(widths).toEqual([60, 60, 60])
    await ui.unmount()
})

test('with room for two charts near their best width, they go side by side, sharing the width evenly', async ($) => {
    const ui = await mountStory($, ID, 'terminal')
    const key = await clientKey(ui)
    await ui.resize({ columns: 120, rows: 4, in: key })
    expect((await cells(ui)).map((b: any) => b.props.width)).toEqual([59, 59, 59])
    await ui.unmount()
})

test('a wide pane takes three columns, each chart filling its share', async ($) => {
    const ui = await mountStory($, ID, 'terminal')
    await ui.resize({ columns: 240, rows: 4, in: await clientKey(ui) })
    expect((await cells(ui)).map((b: any) => b.props.width)).toEqual([79, 79, 79])
    await ui.unmount()
})

test('on mobile, unmeasured, the charts stack', async ($) => {
    const ui = await mountStory($, ID, 'mobile')
    expect(await cells(ui)).toEqual([])
    expect((await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.flexGrow === 1).length).toBeGreaterThanOrEqual(3)
    await ui.unmount()
})

test('responsive, two columns at most: side by side when wide, one under the other when too narrow', async ($) => {
    const ui = await mountStory($, 'templates-claude-code-chart-grid--responsive', 'terminal')
    const key = await clientKey(ui)
    await ui.resize({ columns: 240, rows: 4, in: key })
    expect((await cells(ui)).map((b: any) => b.props.width)).toEqual([119, 119, 119, 119])
    await ui.resize({ columns: 100, rows: 4, in: key })
    expect((await cells(ui)).map((b: any) => b.props.width)).toEqual([100, 100, 100, 100])
    await ui.unmount()
})
