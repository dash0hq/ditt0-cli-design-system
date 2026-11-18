import { test, expect } from 'claude-code/testing'
import { mountStory, clientKey } from '../../../../tests/story.ts'

// The rects of a drawn svg, by their attributes
const rects = (svg: any) => [...svg.props.source.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g)]
    .map(([, x, y, w, h]) => ({ x: +x, y: +y, w: +w, h: +h }))

test('a horizontal bar chart is a row of coloured blocks per bar in the terminal, each its own colour, its value with the unit', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--horizontal', 'terminal', 'dark')
    const blocks: any[] = await ui.findAll({ type: 'Text', text: /^█+$/ } as any)
    expect(new Set(blocks.map(b => b.props.color)).size).toBe(3)
    expect(await ui.find({ type: 'Text', text: /^486\/s$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Svg' } as any)).toBeUndefined()
    await ui.unmount()
})

test('a bar chart is vertical by default: a y axis from zero, the unit above it, dashed gridlines and a ticked baseline in the terminal', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--default', 'terminal', 'dark')
    // 547 is the tallest: the gridlines read round numbers, 600 and a third of it, 200
    expect(await ui.find({ type: 'Text', text: /600 ┤/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /200 ┤/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ +ms$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /0 └/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^┄+$/ } as any)).toMatchObject({ props: { dimColor: true } })
    expect(await ui.find({ type: 'Text', text: /┬/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^05:00/ } as any)).toBeDefined()
    await ui.unmount()
})

// The test tree leaves hover props out, so this checks the card waits hidden, opaque, with the exact value and unit
test('every vertical bar has a hidden opaque card with its label and exact value', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--default', 'terminal', 'dark')
    const cards = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute')
    expect(cards.length).toBe(5)
    expect(cards[2].props).toMatchObject({ display: 'none', backgroundColor: 'inverseText' })
    expect(await ui.find({ type: 'Text', text: /^547 ms$/ } as any)).toBeDefined()
    await ui.unmount()
})

test('grouped bars draw a bar per series at every label, in two colours, with a legend and a card per group', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--grouped', 'terminal', 'dark')
    const bars: any[] = await ui.findAll({ type: 'Text', text: /^[▁▂▃▄▅▆▇█]+$/ } as any)
    expect(new Set(bars.map(b => b.props.color)).size).toBe(2)
    expect(await ui.find({ type: 'Text', text: /^p99$/ } as any)).toBeDefined()
    // Two 3-cell bars a cell apart: the tick sits under that gap, the middle of the group, and the label over it
    expect(await ui.find({ type: 'Text', text: /^───┬───$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ 03:35 $/ } as any)).toBeDefined()
    const cards = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute')
    expect(cards.length).toBe(5)
    await ui.unmount()
})

test('stacked bars show every segment: textured where a segment fills a cell, an eighth block on the next colour where it ends', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--stacked', 'terminal', 'dark')
    // fulfillment-queue-worker and order-history-api are under a row each, yet both show: a segment's end is an
    // eighth block in its colour on the colour of the segment above it
    const boundaries: any[] = (await ui.findAll({ type: 'Text', text: /^[▁▂▃▄▅▆▇]+$/ } as any)).filter((t: any) => t.props.backgroundColor)
    expect(new Set(boundaries.flatMap((t: any) => [t.props.color, t.props.backgroundColor])).size).toBe(3)
    // The legend shows each texture beside its name
    for (const shade of ['██', '▓▓', '▒▒']) expect(await ui.find({ type: 'Text', text: shade } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^order-history-api$/ } as any)).toBeDefined()
    // 1126 + 144 + 86 = 1356 is the tallest stack: the gridlines read 1500 and 500
    expect(await ui.find({ type: 'Text', text: /1500 ┤/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /500 ┤/ } as any)).toBeDefined()
    await ui.unmount()
})

test('a vertical bar chart fills the width of the box it sits in, and narrows again with it', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--default', 'terminal', 'dark')
    const key = await clientKey(ui)
    // 80 cells: a 3-cell axis and 2 more leave 75, 15 a group with a cell before each, so 14, odd so 13
    await ui.resize({ columns: 80, rows: 12, in: key })
    expect(await ui.find({ type: 'Text', text: /^─{6}┬─{6}$/ } as any)).toBeDefined()
    // 40 cells leave 5 a column: as narrow as the labels need
    await ui.resize({ columns: 40, rows: 12, in: key })
    expect(await ui.find({ type: 'Text', text: /^─{2}┬─{2}$/ } as any)).toBeDefined()
    await ui.unmount()
})

test('a horizontal bar chart runs its track to two cells short of the end of the box it sits in, with guidelines and an axis', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--horizontal', 'terminal', 'dark')
    // 80 cells, less the 24-cell label, the 5-cell value, the two gaps and the two empty cells on the right
    await ui.resize({ columns: 80, rows: 4, in: await clientKey(ui) })
    // The scale runs to a round 500/s: api's 486/s is 46 of the track's 47 cells, the last dim with its guideline
    expect(await ui.find({ type: 'Text', text: /^█{46}$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^┊$/ } as any)).toMatchObject({ props: { dimColor: true } })
    expect(await ui.find({ type: 'Text', text: /└─{23}┴─{22}┴$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /0 +250\/s +500\/s$/ } as any)).toBeDefined()
    await ui.unmount()
})

for (const surface of ['desktop', 'mobile'] as const) {
    test(`a bar chart's svg fills the width of its slot on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-barchart--default', surface)
        const svg: any = await ui.find({ type: 'Svg' } as any)
        expect(svg.props.width).toBeUndefined()
        expect(svg.props.source).toMatch(/<svg [^>]*width="100%"/)
        await ui.unmount()
    })

    test(`a horizontal bar chart is an svg of rows, each as long as its value, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-barchart--horizontal', surface)
        const svg: any = await ui.find({ type: 'Svg' } as any)
        expect(svg.props.alt).toMatch(/^Requests per second/)
        expect(svg.props.source).toMatch(/api: 486\/s/)
        const r = rects(svg)
        expect(new Set(r.map(b => b.h)).size).toBe(1)
        expect(r[0].w).toBeGreaterThan(r[1].w)
        await ui.unmount()
    })

    test(`a vertical bar chart is an svg of columns, each as tall as its value, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-barchart--default', surface)
        const r = rects(await ui.find({ type: 'Svg' } as any))
        expect(new Set(r.map(b => b.w)).size).toBe(1)
        expect(r[2].h).toBeGreaterThan(r[4].h)
        await ui.unmount()
    })

    test(`grouped bars sit side by side in an svg, with a legend, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-barchart--grouped', surface)
        const r = rects(await ui.find({ type: 'Svg' } as any))
        expect(r.length).toBe(10)
        // p95 and p99 at 03:35: next to each other, the same baseline
        expect(r[1].x).toBeGreaterThan(r[0].x)
        expect(r[0].y + r[0].h).toBe(r[1].y + r[1].h)
        expect(await ui.find({ type: 'Text', text: /^p95$/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`stacked bars sit one on another in an svg, hatched above the first, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-barchart--stacked', surface)
        const svg: any = await ui.find({ type: 'Svg' } as any)
        expect(svg.props.source).toMatch(/fill="url\(#hatch-1\)"/)
        const r = rects(svg)
        // api, then fulfillment-queue-worker on top of it, at 03:35
        expect(r[1].x).toBe(r[0].x)
        expect(r[1].y + r[1].h).toBe(r[0].y)
        await ui.unmount()
    })
}

test('three quantiles a group: p50, too small to draw to scale beside p99, is a thin line, and in the legend and every card', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--grouped-quantiles', 'terminal', 'dark')
    const bars: any[] = await ui.findAll({ type: 'Text', text: /^[▁▂▃▄▅▆▇█]+$/ } as any)
    expect(new Set(bars.map(b => b.props.color)).size).toBe(3)
    // The smallest bar there is: one eighth, at the axis
    expect(bars.some(b => /^▁+$/.test(b.text))).toBe(true)
    expect(await ui.find({ type: 'Text', text: /^p50$/ } as any)).toBeDefined()
    expect((await ui.findAll({ type: 'Text', text: /^0\.66 ms$/ } as any)).length).toBe(4)
    await ui.unmount()
})

test('thirty bars in six groups fit a narrow box, every series named in the legend', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--grouped-many-series', 'terminal', 'dark')
    await ui.resize({ columns: 60, rows: 30, in: await clientKey(ui) })
    for (const name of ['fulfillment-queue-worker', 'order-history-api', 'gcp-warehouse-sync-tasks-worker', 'aws-warehouse-sync-tasks-worker', 'search']) {
        expect(await ui.find({ type: 'Text', text: new RegExp(`^${name}$`) } as any)).toBeDefined()
    }
    expect((await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute').length).toBe(6)
    await ui.unmount()
})

// Each row's cells as one string, from a row Box of the chart's
const textOf = (n: any): string => typeof n === 'string' ? n : (n.children ?? []).map(textOf).join('')

test('a grouped chart never runs past its box: short of room, bars in a group touch, then the groups close up', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--grouped-many-series', 'terminal', 'dark')
    const key = await clientKey(ui)
    // 30 bars need 41 cells at the least: a cell a bar, one between groups, and the axis
    for (const columns of [50, 60, 77, 100, 140]) {
        await ui.resize({ columns, rows: 4, in: key })
        const rows: any[] = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.flexShrink === 0 && b.props.flexDirection === 'row')
        // The plot's rows and its axis; the legend wraps on its own
        for (const row of rows.slice(0, 10)) expect(textOf(row).length).toBeLessThanOrEqual(columns - 2)
    }
    await ui.unmount()
})

test('horizontal groups draw a row per window under each service, its value beside it', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--grouped-horizontal', 'terminal', 'dark')
    expect(await ui.find({ type: 'Text', text: /^gcp-warehouse-sync-tasks-worker/ } as any)).toBeDefined()
    // order-history-api halved from the first 4 hours to the last
    expect(await ui.find({ type: 'Text', text: /^61\.6\/s$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^31\.9\/s$/ } as any)).toBeDefined()
    await ui.unmount()
})

test('six stacked series all reach the legend, past the four textures', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--stacked-many-series', 'terminal', 'dark')
    for (const name of ['api', 'aws-warehouse-sync-tasks-worker', 'search']) expect(await ui.find({ type: 'Text', text: new RegExp(`^${name}$`) } as any)).toBeDefined()
    await ui.unmount()
})

test('a stacked ERROR segment is the error red, as its span status says', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--stacked-status', 'terminal', 'dark')
    const blocks: any[] = await ui.findAll({ type: 'Text', text: /^█+$/ } as any)
    expect(blocks.some(b => b.props.color === '#e33238')).toBe(true)
    await ui.unmount()
})

test('a window with no samples draws no bar and says no data', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--grouped-gaps', 'terminal', 'dark')
    expect(await ui.find({ type: 'Text', text: /no data/ } as any)).toBeDefined()
    await ui.unmount()
})

for (const surface of ['desktop', 'mobile'] as const) {
    test(`the grouped and stacked examples each draw an svg with a legend on ${surface}`, async ($) => {
        for (const id of ['grouped-quantiles', 'grouped-many-series', 'grouped-horizontal', 'stacked-many-series', 'stacked-status', 'grouped-gaps']) {
            const ui = await mountStory($, `components-charts-barchart--${id}`, surface)
            expect(rects(await ui.find({ type: 'Svg' } as any)).length).toBeGreaterThan(5)
            await ui.unmount()
        }
    })
}

// A narrow Box: 30 bars in six groups get one cell each rather than run past the edge, where the engine would
// squeeze each row and wrap it, dropping the bars and ticks a line below their labels
test('grouped bars narrow to fit the Box they sit in, down to one cell, and never run past it', async ($) => {
    const ui = await mountStory($, 'components-charts-barchart--grouped-many-series', 'terminal', 'dark')
    const key = await clientKey(ui)
    await ui.resize({ columns: 74, rows: 40, in: key } as any)
    const bars: any[] = await ui.findAll({ type: 'Text', text: /^█+$/ } as any)
    expect(bars.length).toBeGreaterThan(0)
    expect(Math.max(...bars.map(b => b.text?.length ?? String(b.props.children ?? '').length))).toBe(1)
    // Every row is set to the width its cells take, never more than the Box: a row held to its parent's width would
    // wrap its cells onto a second line
    const rows = async () => (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.flexDirection === 'row' && Number.isInteger(b.props.width))
    expect((await rows()).length).toBeGreaterThan(8)
    expect(Math.max(...(await rows()).map((b: any) => b.props.width))).toBeLessThanOrEqual(72)
    // Wider, the bars widen with it
    await ui.resize({ columns: 200, rows: 40, in: key } as any)
    const wide: any[] = await ui.findAll({ type: 'Text', text: /^█+$/ } as any)
    expect(Math.max(...wide.map(b => b.text?.length ?? 0))).toBeGreaterThan(1)
    expect(Math.max(...(await rows()).map((b: any) => b.props.width))).toBeLessThanOrEqual(198)
    await ui.unmount()
})
