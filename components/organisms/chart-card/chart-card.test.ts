import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES, clientKey } from '../../../tests/story.ts'

// Where the Default story's chart draws: in its Client, which answers the pointer, or, on mobile, in the tree
const chartScope = async (ui: any) => {
    const key = await clientKey(ui)
    return key ? { in: key } : {}
}

for (const surface of SURFACES) {
    test(`a chart card draws its title, subtitle and chart inside a dim rounded border on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcard--default', surface)
        const boxes: any[] = await ui.findAll({ type: 'Box', text: /Requests per second/ } as any)
        expect(boxes.some(b => b.props.borderStyle === 'round' && b.props.borderDimColor === true)).toBe(true)
        expect(await ui.find({ type: 'Text', text: /^sum by \(service_name\)/ } as any)).toBeDefined()
        // The chart: its time axis, and a series' box-drawn line
        expect(await ui.find({ type: 'Text', text: /└/, ...(await chartScope(ui)) } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /[╭╮╰╯]/, ...(await chartScope(ui)) } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`the selected range is drawn bright, the others dim, and pressing one reports it on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcard--default', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-24h' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Button', key: 'tab-1h' } as any)).toMatchObject({ props: { dimColor: true } })
        await ui.press({ key: 'tab-1h' })
        expect(await ui.find({ type: 'Text', text: /Action: onRangeChange\("1h"\)/ } as any)).toBeDefined()
        // The story keeps the range it was told, as a page would: 1h is now the bright one, and the chart
        // shows the last hour, a column per 5-minute sample
        expect(await ui.find({ type: 'Button', key: 'tab-1h' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Button', key: 'tab-24h' } as any)).toMatchObject({ props: { dimColor: true } })
        const ticks = (await ui.findAll({ type: 'Text', text: /^[┬─]$/, ...(await chartScope(ui)) } as any)).length
        const cards = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute').length
        expect(surface === 'mobile' ? cards : ticks).toBe(12)
        await ui.unmount()
    })

    test(`the Dots / Lines switch redraws the line chart in braille or box-drawing glyphs on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcard--default', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-box' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Text', text: /[╭╮╰╯]/, ...(await chartScope(ui)) } as any)).toBeDefined()
        await ui.press({ key: 'tab-braille' })
        expect(await ui.find({ type: 'Button', key: 'tab-braille' } as any)).toMatchObject({ props: { dimColor: false } })
        expect(await ui.find({ type: 'Text', text: /^[\u2801-\u28ff ┄]+$/, ...(await chartScope(ui)) } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /[╭╮╰╯]/, ...(await chartScope(ui)) } as any)).toBeUndefined()
        await ui.unmount()
    })

    // Several series as bars are a grouped BarChart (Timeseries asBarChart): no braille line left
    test(`the Bars choice redraws the time series as bars, one a time, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcard--default', surface)
        await ui.press({ key: 'tab-bars' })
        expect(await ui.find({ type: 'Button', key: 'tab-bars' } as any)).toMatchObject({ props: { label: '▁▃▅ Bars', dimColor: false } })
        // Zoomable, the chart draws in its Client from the cells it is handed, on mobile as Texts
        const client: any = await ui.find({ type: 'Client' } as any)
        if (client) expect(JSON.stringify(client.props.props.panels)).toMatch(/[▁▂▃▄▅▆▇█]/)
        else expect(await ui.find({ type: 'Text', text: /[▁▂▃▄▅▆▇█]/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /[\u2801-\u28ff╭╮╰╯]/ } as any)).toBeUndefined()
        await ui.unmount()
    })

    test(`an unzoomed card offers no Reset zoom on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcard--default', surface)
        expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeUndefined()
        await ui.unmount()
    })

    test(`a card with no ranges draws no range buttons on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-chartcard--no-ranges', surface)
        expect(await ui.find({ type: 'Button', key: 'tab-1h' } as any)).toBeUndefined()
        // A bar chart has no line type to switch
        expect(await ui.find({ type: 'Button', key: 'tab-braille' } as any)).toBeUndefined()
        expect(await ui.find({ type: 'Text', text: /during the 05:00 incident/ } as any)).toBeDefined()
        await ui.unmount()
    })
}

test('the chart inside a card fills the card\'s width in the terminal', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--bar-chart-card', 'terminal')
    // The width the card's inside measures: its border and padding already taken off
    await ui.resize({ columns: 60, rows: 12, in: await clientKey(ui) })
    // 60 cells: a 3-cell axis and 2 more leave 55, 11 a group with a cell before each, so 10, odd so 9
    expect(await ui.find({ type: 'Text', text: /^─{4}┬─{4}$/ } as any)).toBeDefined()
    await ui.unmount()
})

test('dragging across the plot zooms in, and Reset zoom goes back', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    const key = await clientKey(ui)
    await ui.resize({ columns: 80, rows: 1, in: key })
    await ui.pointer({ type: 'down', x: 20, y: 0, button: 'left', in: key })
    await ui.pointer({ type: 'move', x: 40, y: 0, in: key })
    await ui.pointer({ type: 'up', x: 40, y: 0, button: 'left', in: key })
    expect(await ui.find({ type: 'Text', text: /Action: onZoom\(/ } as any)).toBeDefined()
    // The span takes the ranges' place, selected, with the way back beside it
    expect(await ui.find({ type: 'Button', key: 'tab-zoom', text: /^\d\d:\d\d–\d\d:\d\d$/ } as any)).toMatchObject({ props: { dimColor: false } })
    expect(await ui.find({ type: 'Button', key: 'tab-24h' } as any)).toBeUndefined()
    await ui.press({ key: 'reset-zoom' })
    expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeUndefined()
    expect(await ui.find({ type: 'Button', key: 'tab-24h' } as any)).toBeDefined()
    await ui.unmount()
})

test('− and + zoom out and in without a drag, from the keyboard too, when the card has addZoomControl', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    expect(await ui.find({ type: 'Button', key: 'zoom-in' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'zoom-out' } as any)).toBeDefined()
    await ui.press({ key: 'zoom-in' })
    // The middle half of 24 hours
    expect(await ui.find({ type: 'Button', key: 'tab-zoom', text: /^\d\d:\d\d–\d\d:\d\d$/ } as any)).toBeDefined()
    await ui.press({ key: 'zoom-in' })
    await ui.press({ key: 'zoom-out' })
    expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeDefined()
    // Out again reaches the whole range: the zoom ends
    await ui.press({ key: 'zoom-out' })
    expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeUndefined()
    await ui.unmount()
})

test('a card without addZoomControl draws no − and + buttons', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--bar-chart-card', 'terminal')
    expect(await ui.find({ type: 'Button', key: 'zoom-in' } as any)).toBeUndefined()
    await ui.unmount()
})

test('hovering a column lights its points and shows its card, beside it, until the pointer leaves', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    const key = await clientKey(ui)
    await ui.resize({ columns: 80, rows: 20, in: key })
    const card = async () => (await ui.findAll({ type: 'Box', in: key } as any)).find((b: any) => b.props.position === 'absolute')
    expect(await card()).toBeUndefined()
    await ui.pointer({ type: 'move', x: 30, y: 4, in: key })
    expect((await card())?.text).toMatch(/order-history-api/)
    // Lit in its own colour moved toward the text colour, never plain white
    const lit = (await ui.findAll({ type: 'Text', in: key } as any)).filter((t: any) => t.props.bold && /^#[0-9a-f]{6}$/.test(t.props.color ?? ''))
    expect(lit.length).toBeGreaterThan(0)
    expect(lit.every((t: any) => t.props.color !== '#ffffff')).toBe(true)
    await ui.pointer({ type: 'leave', x: 30, y: 4, in: key })
    expect(await card()).toBeUndefined()
    await ui.unmount()
})

test('i and o zoom in and out around the moment under the pointer, as a map does', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    const key = await clientKey(ui)
    await ui.resize({ columns: 80, rows: 20, in: key })
    // A moment near the right end of 24 hours: the zoomed span keeps it, so it ends late in the day
    await ui.pointer({ type: 'move', x: 70, y: 4, in: key })
    // The card's first and last times: a column's span, or with dots each sample's time
    const card = async () => { const t = (await ui.find({ type: 'Text', text: /^ *\d\d:\d\d/, in: key } as any))?.text.match(/\d\d:\d\d/g) ?? []; return `${t[0]}–${t.at(-1)}` }
    const before = await card()
    await ui.key({ key: 'i', in: key })
    const zoom = (await ui.find({ type: 'Button', key: 'tab-zoom' } as any))?.text
    expect(zoom).toMatch(/^\d\d:\d\d–\d\d:\d\d$/)
    // The same moment is still under the pointer: its column now holds fewer samples, all within the ones before
    const [from, to] = String(before).split('–')
    const [zoomedFrom, zoomedTo = zoomedFrom] = String(await card()).split('–')
    expect(zoomedFrom >= from && zoomedTo <= (to ?? from)).toBe(true)
    await ui.key({ key: 'o', in: key })
    expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeUndefined()
    await ui.unmount()
})

test('r pressed while the chart has the keys resets the zoom, as Reset zoom does', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    const key = await clientKey(ui)
    await ui.resize({ columns: 80, rows: 20, in: key })
    await ui.pointer({ type: 'move', x: 40, y: 4, in: key })
    await ui.key({ key: 'i', in: key })
    expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeDefined()
    await ui.key({ key: 'r', in: await clientKey(ui) })
    expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeUndefined()
    await ui.unmount()
})

test('hovering a group of bars lights every bar in it, each its own colour moved toward the text', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    await ui.press({ key: 'tab-bars' })
    const key = await clientKey(ui)
    await ui.resize({ columns: 80, rows: 20, in: key })
    const { offset } = (await ui.find({ type: 'Client', key } as any) as any).props.props
    // Over the first group's first bar: its other two bars light with it
    await ui.pointer({ type: 'move', x: offset, y: 10, in: key })
    const lit: any[] = (await ui.findAll({ type: 'Text', in: key } as any)).filter((t: any) => t.props.bold && /^[▁▂▃▄▅▆▇█]+$/.test(t.text))
    expect(new Set(lit.map(t => t.props.color)).size).toBe(3)
    await ui.unmount()
})

test('every labelled row of a line chart has its guideline, the lowest too', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    const key = await clientKey(ui)
    await ui.resize({ columns: 80, rows: 20, in: key })
    const client: any = await ui.find({ type: 'Client', key } as any)
    for (const panel of client.props.props.panels) {
        const labelled = panel.axis.map((a: string, r: number) => a.endsWith('┤') ? r : -1).filter((r: number) => r >= 0)
        expect(labelled.length).toBe(3)
        for (const r of labelled) expect(panel.grid[r]).toBe(true)
    }
    await ui.unmount()
})

test('several series as bars in a card are grouped, a bar per series in each window, and still zoom', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--default', 'terminal')
    await ui.press({ key: 'tab-bars' })
    const key = await clientKey(ui)
    await ui.resize({ columns: 80, rows: 20, in: key })
    const client: any = await ui.find({ type: 'Client', key } as any)
    // One shared panel: each window's columns are its three bars, each its own series' colour, then an empty gap
    const [panel] = client.props.props.panels
    const bottom = panel.color[panel.color.length - 1]
    const first = bottom.slice(0, 5)
    expect(new Set(first.slice(0, 3)).size).toBe(3)
    expect(first.slice(3)).toEqual([-1, -1])
    await ui.pointer({ type: 'move', x: 40, y: 4, in: key })
    await ui.key({ key: 'i', in: key })
    expect(await ui.find({ type: 'Button', key: 'reset-zoom' } as any)).toBeDefined()
    await ui.unmount()
})

test('a bar chart card switches Vertical and Horizontal, and redraws its bars that way', async ($) => {
    const ui = await mountStory($, 'components-charts-chartcard--bar-chart-card', 'terminal')
    expect(await ui.find({ type: 'Button', key: 'tab-vertical' } as any)).toMatchObject({ props: { dimColor: false } })
    await ui.press({ key: 'tab-horizontal' })
    // Horizontal bars: a row each, the value beside it
    expect(await ui.find({ type: 'Text', text: /^547 ms$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /┤/ } as any)).toBeUndefined()
    await ui.unmount()
})
