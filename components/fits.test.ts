import { test, expect } from 'claude-code/testing'
import { mountStory } from '../tests/story.ts'
import { COMPONENTS } from './pages/gallery/stories.js'

// How many cells wide a drawn tree lays out, by its props: rows add their children, columns take the widest.
// A row wider than its Box is squeezed by the engine, and its Texts wrap onto more lines: the bug that drops a
// chart's bars and ticks a line below their labels. Absolute and hidden Boxes (hover cards) don't count
const pad = (p: any, side: 'X') => (p[`padding${side}`] ?? p.padding ?? 0) * 2 + (p.borderStyle ? 2 : 0)
// A Text cut to its room (wrap truncate), or prose set to wrap onto more lines (wrap wrap), takes what it is given
// and pushes nothing wider
const textOf = (n: any): string => typeof n === 'string' ? n : /^(truncate|wrap$)/.test(String(n?.props?.wrap ?? '')) ? '' : (n?.children ?? []).map(textOf).join('')
const widthOf = (n: any): number => {
    if (n === null || n === undefined || typeof n === 'boolean') return 0
    if (typeof n === 'string') return Math.max(0, ...n.split('\n').map(l => [...l].length))
    const p = n.props ?? {}
    // Hidden or absolute (hover cards), or clipping what overflows it: it pushes nothing wider
    if (p.position === 'absolute' || p.display === 'none' || p.overflow === 'hidden') return 0
    if (n.type === 'Text') return Math.max(0, ...textOf(n).split('\n').map(l => [...l].length))
    if (n.type === 'Client' || n.type === 'Svg' || n.type === 'Image') return 0
    if (typeof p.width === 'number') return p.width
    // A share of its parent, such as a Table's column: it sizes to the parent, never pushes it
    if (typeof p.width === 'string') return 0
    const kids = (n.children ?? []).map(widthOf)
    if (p.flexDirection === 'row' && p.flexWrap !== 'wrap') return kids.reduce((a: number, b: number) => a + b, 0) + (p.columnGap ?? p.gap ?? 0) * Math.max(0, kids.length - 1) + pad(p, 'X')
    return Math.max(0, ...kids) + pad(p, 'X')
}

// The cells a Box's padding and border take, summed down to the first Client: the room the story's chart was given
// is the Client's width, and a card around it adds its own chrome
const chrome = (n: any): number | null => {
    if (!n || typeof n !== 'object') return null
    if (n.type === 'Client') return 0
    for (const child of n.children ?? []) {
        const inner = chrome(child)
        if (inner !== null) return inner + (n.type === 'Box' ? pad(n.props ?? {}, 'X') : 0)
    }
    return null
}

// Every Client and the cells the Boxes around it take: a page's charts sit at different depths, one in a card and one
// not, and each is given the room its own Boxes leave
const clientsOf = (n: any, around = 0): { key: string; around: number }[] => {
    if (!n || typeof n !== 'object') return []
    if (n.type === 'Client') return [{ key: n.props?.key, around }]
    const inner = around + (n.type === 'Box' ? pad(n.props ?? {}, 'X') : 0)
    return (n.children ?? []).flatMap((c: any) => clientsOf(c, inner))
}

const STORIES = COMPONENTS.filter(c => /Charts|Status|Data|Services Overview|Pages\/Tracing|Spec Page/.test(c.title)).flatMap(c => c.stories.map(s => s.id))

for (const columns of [90, 74, 72, 60, 49]) {
    // Every story of every chart and status view, mounted one after another: longer than a test's usual 5 s
    test(`every chart and status view fits ${columns} columns`, { timeoutMs: 20000 }, async ($) => {
        const over: string[] = []
        for (const id of STORIES) {
            const ui = await mountStory($, id, 'terminal', 'dark')
            const first = chrome(await ui.drawn()) ?? 0
            for (const client of clientsOf(await ui.drawn())) await ui.resize({ columns: columns + first - client.around, rows: 60, in: client.key } as any)
            const drawn = await ui.drawn()
            const width = widthOf(drawn)
            const room = columns + first
            if (width > room) over.push(`${id}: ${width} in ${room}`)
            await ui.unmount()
        }
        expect(over).toEqual([])
    })
}
