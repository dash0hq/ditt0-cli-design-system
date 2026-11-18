import { test, expect } from 'claude-code/testing'
import { mountStory, SURFACES, clientKey } from '../../../../tests/story.ts'
import { toScene, axisLabels } from './timeseries.js'

for (const surface of SURFACES) {
    test(`each series gets its own colour from the color manager on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--default', surface, 'dark')
        const colors = (await ui.findAll({ type: 'Text', text: '━' } as any)).slice(0, 3).map((t: any) => t.props.color)
        expect(new Set(colors).size).toBe(3)
        await ui.unmount()
    })

    test(`an ERROR span status draws in Dash0's error red, for each theme, on ${surface}`, async ($) => {
        const dark = await mountStory($, 'components-charts-timeseries--span-status', surface, 'dark')
        expect(await dark.find({ type: 'Text', text: '━' } as any)).toMatchObject({ props: { color: '#e33238' } })
        await dark.unmount()
        const light = await mountStory($, 'components-charts-timeseries--span-status', surface, 'light')
        expect(await light.find({ type: 'Text', text: '━' } as any)).toMatchObject({ props: { color: '#ff3d44' } })
        await light.unmount()
    })

    test(`more than three series draw as small multiples, each series named, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--small-multiples', surface)
        expect(await ui.find({ type: 'Text', text: /price-engine/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`each small multiple is headed by its series' name, so its axis isn't read as the next one's, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--span-status', surface)
        for (const name of ['ERROR', 'UNSET', 'OK']) expect(await ui.find({ type: 'Text', text: new RegExp(`^${name}$`) } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`small multiples write their unit beside each panel's name, and after every value in the cards, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--default', surface)
        expect((await ui.findAll({ type: 'Text', text: /^p(50|95|99) · (ms|μs)$/ } as any)).length).toBe(3)
        expect(await ui.find({ type: 'Text', text: /^ *372 ms/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a unit that scales: bytes read in GB, once above a shared axis and in every card, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--bytes', surface)
        expect((await ui.findAll({ type: 'Text', text: /^ *GB$/ } as any)).length).toBe(1)
        expect(await ui.find({ type: 'Text', text: /^ *25\.2 GB$/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /^ *122 GB$/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`seconds under one read in ms on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--seconds', surface)
        expect(await ui.find({ type: 'Text', text: /^ *372 ms/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a shared panel has a legend under it, unless legend is false, on ${surface}`, async ($) => {
        // Legend names are plain dim Texts; a card's names are cut to fit (wrap)
        const named = async (id: string) => {
            const ui = await mountStory($, id, surface)
            const found = (await ui.findAll({ type: 'Text', text: 'mail-sink' } as any)).filter((t: any) => !t.props.wrap)
            await ui.unmount()
            return found.length
        }
        expect(await named('components-charts-timeseries--crossing')).toBe(1)
        expect(await named('components-charts-timeseries--no-legend')).toBe(0)
    })

    test(`the y axis reads round numbers, and a time label sits at the end of the time axis, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--bytes', surface)
        // carts peaks at 230 GB: the axis runs 0 to 300 in steps of 150
        expect(await ui.find({ type: 'Text', text: /300 ┤[^]*150 ┤[^]*0 ┤/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /13:16 UTC$|^ *UTC$/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`bars stand on the axis: 0 written on it, and two round gridlines, the upper three times the lower, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--bars', surface, 'dark')
        expect(await ui.find({ type: 'Text', text: /^ *0 └$/ } as any)).toBeDefined()
        const axis: any = await ui.find({ type: 'Text', text: /┤/ } as any)
        const values = [...axis.text.matchAll(/([\d.]+)K? ┤/g)].map((m: any) => Number(m[1]))
        expect(values.length).toBe(2)
        expect(Math.abs(values[0] / values[1] - 3)).toBeLessThan(0.01)
        await ui.unmount()
    })

    test(`several series as bars are grouped: a bar per series in each window, side by side, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--bars-grouped', surface, 'dark')
        // No braille or box line, and drawn by the chart itself, so it still zooms: no BarChart
        expect(await ui.find({ type: 'Text', text: /^[\u2801-\u28ff╭╮╰╯]$/ } as any)).toBeUndefined()
        expect(await ui.find({ type: 'Svg' } as any)).toBeUndefined()
        const blocks: any[] = await ui.findAll({ type: 'Text', text: /^[▁▂▃▄▅▆▇█]+$/ } as any)
        expect(new Set(blocks.map(b => b.props.color).filter(Boolean)).size).toBeGreaterThanOrEqual(2)
        // Side by side, not one on another: no segment sits on another's colour
        expect(blocks.some(b => b.props.backgroundColor)).toBe(false)
        await ui.unmount()
    })

    test(`stacked bars: one bar a time, the series one on another, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--bars-stacked', surface, 'dark')
        expect(await ui.find({ type: 'Svg' } as any)).toBeUndefined()
        const blocks: any[] = await ui.findAll({ type: 'Text', text: /^[▁▂▃▄▅▆▇█]+$/ } as any)
        expect(new Set(blocks.map(b => b.props.color).filter(Boolean)).size).toBeGreaterThanOrEqual(2)
        await ui.unmount()
    })

    test(`the chart fills the width of the box it sits in: spreading 48 samples out, or folding them, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--default', surface)
        // A card per column: unmeasured, a column per sample
        const columns = async () => (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute').length
        expect(await columns()).toBe(48)
        const key = await clientKey(ui)
        // Mobile has no Client to measure with: it stays a column per sample
        if (!key) return ui.unmount()
        await ui.resize({ columns: 100, rows: 20, in: key })
        expect(await columns()).toBeGreaterThan(90)
        await ui.resize({ columns: 30, rows: 20, in: key })
        expect(await columns()).toBeLessThan(30)
        await ui.unmount()
    })

    test(`the y axis is the same at every width: folding or spreading samples never shaves a spike or a dip, on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--default', surface)
        const axis = async () => (await ui.findAll({ type: 'Text', text: /┤/ } as any)).flatMap((t: any) => t.text.match(/[\d.]+ ┤/g) ?? []).join()
        const natural = await axis()
        // p99's spike, 547 ms, sets the top label, rounded up to 600
        expect(natural).toMatch(/600 ┤/)
        const key = await clientKey(ui)
        if (!key) return ui.unmount()
        for (const columns of [30, 77, 100, 140]) {
            await ui.resize({ columns, rows: 20, in: key })
            expect(await axis()).toBe(natural)
        }
        await ui.unmount()
    })

    test(`where lines cross, every stroke has its series' colour, except box strokes merged on purpose, on ${surface}`, async ($) => {
        // A drawn stroke cell: a box-drawing glyph, a lone point, or braille dots
        const strokes = async (story: string) => {
            const ui = await mountStory($, `components-charts-timeseries--${story}`, surface)
            const cells = (await ui.findAll({ type: 'Text', text: /^[─│╭╮╰╯┬┴├┤┼╵╷╴╶•\u2801-\u28ff]$/ } as any)).filter((t: any) => !t.props.dimColor)
            await ui.unmount()
            return cells
        }
        for (const story of ['crossing', 'box-lines']) {
            const cells = await strokes(story)
            expect(cells.length).toBeGreaterThan(50)
            expect(cells.every((t: any) => t.props.color !== undefined)).toBe(true)
        }
        expect((await strokes('box-merged')).some((t: any) => t.props.color === undefined)).toBe(true)
    })

    test(`braille draws a line of dots, box a line of box-drawing glyphs, on ${surface}`, async ($) => {
        const braille = await mountStory($, 'components-charts-timeseries--crossing', surface)
        expect(await braille.find({ type: 'Text', text: /^[\u2801-\u28ff]$/ } as any)).toBeDefined()
        expect(await braille.find({ type: 'Text', text: /^[╭╮╰╯]$/ } as any)).toBeUndefined()
        await braille.unmount()
        const box = await mountStory($, 'components-charts-timeseries--box-lines', surface)
        expect(await box.find({ type: 'Text', text: /^[╭╮╰╯]$/ } as any)).toBeDefined()
        expect(await box.find({ type: 'Text', text: /^[\u2801-\u28ff]$/ } as any)).toBeUndefined()
        await box.unmount()
    })

    test(`a stretch with no samples is said to have no data on ${surface}`, async ($) => {
        const ui = await mountStory($, 'components-charts-timeseries--gaps', surface)
        expect(await ui.find({ type: 'Text', text: /no data/ } as any)).toBeDefined()
        await ui.unmount()
    })
}

test('a column hiding a spike draws no whisker, and its card marks the high', async ($) => {
    const ui = await mountStory($, 'components-charts-timeseries--box-lines', 'terminal')
    // 40 cells: the 4.43 spike folds into a column with lower samples, so the line sits at their mean
    await ui.resize({ columns: 40, rows: 20, in: await clientKey(ui) })
    const whiskers = (await ui.findAll({ type: 'Text', text: /^│$/ } as any)).filter((t: any) => t.props.dimColor === true && t.props.color)
    expect(whiskers.length).toBe(0)
    expect(await ui.find({ type: 'Text', text: /◆.* ▲4\.43/ } as any)).toBeDefined()
    await ui.unmount()
})

test('every hover card stays inside the chart and leaves it in view, even when its names are wider than the chart', async ($) => {
    const ui = await mountStory($, 'components-charts-timeseries--small-multiples', 'terminal')
    // 30 cells: narrower than a card holding a name such as gcp-warehouse-sync-tasks-worker and its value
    await ui.resize({ columns: 30, rows: 20, in: await clientKey(ui) })
    const cards = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute')
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards as any[]) {
        expect(card.props.left).toBeGreaterThanOrEqual(0)
        expect(card.props.left + card.props.width).toBeLessThanOrEqual(30)
        expect(card.props.width).toBeLessThanOrEqual(24)
    }
    await ui.unmount()
})

test('every chart has its own Dots / Lines / Bars switch and − + zoom, and keeps what is picked', async ($) => {
    const ui = await mountStory($, 'components-charts-timeseries--default', 'terminal', 'dark')
    const button = async (end: string) => (await ui.findAll({ type: 'Button' } as any)).find((b: any) => String(b.props.key).endsWith(end))
    for (const end of ['tab-braille', 'tab-box', 'tab-bars', 'zoom-in', 'zoom-out']) expect(await button(end)).toBeDefined()
    const press = async (end: string) => ui.press({ key: (await button(end)).props.key })
    // Bars: the line turns into bars, in place
    await press('tab-bars')
    expect(await ui.find({ type: 'Text', text: /[▁▂▃▄▅▆▇█]/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /[⠁-⣿]/ } as any)).toBeUndefined()
    // + zooms in: the span shown takes the ranges' place, with Reset zoom; Reset shows it all again
    await press('zoom-in')
    expect(await button('reset-zoom')).toBeDefined()
    await press('reset-zoom')
    expect(await button('reset-zoom')).toBeUndefined()
    await ui.unmount()
})

test('a chart zooms from the keyboard: o out, i in, r reset', async ($) => {
    const ui = await mountStory($, 'components-charts-timeseries--default', 'terminal', 'dark')
    const button = async (end: string) => (await ui.findAll({ type: 'Button' } as any)).find((b: any) => String(b.props.key).endsWith(end))
    expect((await button('zoom-in')).props.hotkey).toBe('i')
    expect((await button('zoom-out')).props.hotkey).toBe('o')
    await ui.press({ key: (await button('zoom-in')).props.key })
    expect((await button('reset-zoom')).props.hotkey).toBe('r')
    await ui.unmount()
})

test('every bar is as wide as the others, the last one too, at any width', async ($) => {
    const ui = await mountStory($, 'components-charts-timeseries--bars', 'terminal')
    const key = await clientKey(ui)
    for (const columns of [40, 61, 77, 100, 140]) {
        await ui.resize({ columns, rows: 20, in: key })
        // A Text per column, top row first: the bottom row is each one's last line
        const textOf = (n: any): string => typeof n === 'string' ? n : (n?.children ?? []).map(textOf).join('')
        const columnsOf: string[] = []
        const walk = (n: any) => { if (!n || typeof n !== 'object') return; const t = textOf(n); if (n.type === 'Text' && t.split('\n').length > 5) columnsOf.push(t.split('\n').at(-1)!); else (n.children ?? []).forEach(walk) }
        walk(await ui.drawn())
        const runs = columnsOf.map(c => /[▁-█]/.test(c) ? c : ' ').join('').split(/ +/).filter(Boolean).map(r => r.length)
        expect(runs.length).toBeGreaterThan(1)
        expect(new Set(runs).size).toBe(1)
    }
    await ui.unmount()
})

test('every y label is round and its row\'s exact value, so the gridlines never lie about where a value is', async ($) => {
    // Every series' panel, several at a time: their axes run 99 to 102, 120 to 200, and so on
    for (const id of ['components-charts-timeseries--small-multiples', 'components-charts-timeseries--default', 'components-charts-timeseries--crossing']) {
        const ui = await mountStory($, id, 'terminal')
        await ui.resize({ columns: 100, rows: 40, in: await clientKey(ui) })
        for (const t of await ui.findAll({ type: 'Text', text: /┤[^]*┤[^]*┤/ } as any) as any[]) {
            const [top, mid, low] = [...t.text.matchAll(/(-?[\d.]+)[^\d\n]* ┤/g)].map((m: any) => Number(m[1]))
            expect(Math.abs((top + low) / 2 - mid)).toBeLessThan(Math.abs(top - low) * 1e-6 + 1e-9)
            // Round: three significant figures at most
            for (const v of [top, mid, low]) expect(Number(v.toPrecision(3))).toBe(v)
        }
        await ui.unmount()
    }
})

test('with dots, a column\'s card shows each sample the column draws, its time over its value, not their mean', async ($) => {
    const ui = await mountStory($, 'components-charts-timeseries--dots', 'terminal')
    const key = await clientKey(ui)
    // 48 samples on 24 columns: two a column, a dot column each
    await ui.resize({ columns: 24 + 9, rows: 20, in: key })
    const cards = (await ui.findAll({ type: 'Box' } as any)).filter((b: any) => b.props.position === 'absolute') as any[]
    const textOf = (n: any): string => typeof n === 'string' ? n : (n?.children ?? []).map(textOf).join('')
    const first = textOf(cards[0])
    expect((first.match(/\d\d:\d\d/g) ?? []).length).toBe(2)
    expect(first).not.toMatch(/–/)
    await ui.unmount()
})

test('beside a gap the line ends at the sample: no column between it and the gap draws a stroke', async () => {
    // Five samples spread over the columns, the third missing: the second's line must stop at its own column
    const values = [1, 2, null, 3, 4]
    const scene = toScene([{ name: 'a', values, color: '#828aff' }], {}, 40)
    const grid = scene.grids[0]
    const columns = grid[0].length
    const at = values.map((_, i) => Math.round((i * (columns - 1)) / (values.length - 1)))
    const drawn = (c: number) => grid.some((row: any[]) => row[c].text !== null)
    expect(drawn(at[1])).toBe(true)
    for (let c = at[1] + 1; c < at[3]; c++) expect(drawn(c)).toBe(false)
    // The cards there still name the sample nearest them
    expect(scene.bucketed[0].points[at[1] + 1].mean).toBe(2)
})

test('time labels never touch: one that would run into the label before it is left out', async () => {
    // Ten samples, ten columns: 10:20 would overlap 10:00, and 10:45 would start where 10:00 ends
    const times = Array.from({ length: 10 }, (_, i) => `10:${String(i * 5).padStart(2, '0')}`)
    const scene = toScene([{ name: 'a', values: times.map((_, i) => i), color: '#828aff' }], { times }, 0)
    expect(axisLabels(scene.bucketed[0].points, times)).toBe('10:00')
    // With room, all three, a blank cell at least between them
    const wide = toScene([{ name: 'a', values: times.map((_, i) => i), color: '#828aff' }], { times }, 40)
    expect(axisLabels(wide.bucketed[0].points, times)).toMatch(/^10:00 +10:2[05] +10:45$/)
})
