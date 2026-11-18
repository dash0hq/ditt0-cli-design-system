// A Timeseries that answers the pointer itself, drawn from the plain data timeseries.js hands it (forClient).
// The engine tells a hooks module nothing about hover, so a chart that zooms where the pointer is draws here:
// the column under the pointer lights and shows its card; a drag across the plot lights the columns covered, and
// letting go posts them; i or +, o or − post a zoom, r its reset. Every post carries the width, the column under the pointer
// (null when none), and the last event, which the hooks module runs once (measure.js receive)
export default function TimeseriesClient(props, client) {
    const { Box, Text } = client.elements
    const { offset, labelWidth, unit, columns, panels, ticks, labels, card, series, values, palette, lit, group } = props
    // One object kept as the state, which every listener changes: several pointer events can come between two
    // frames, before a setState is drawn. posted: the width last posted
    const live = client.state ?? { hover: null, drag: null, event: null, seq: 0, posted: 0 }
    const post = () => {
        if (client.columns > 0) client.post({ columns: client.columns, hover: live.hover, ...(live.event ? { event: live.event } : {}) })
    }
    const send = (event) => {
        // Later than any event before it, from this instance or the one this chart had before
        live.seq = Math.max(live.seq + 1, typeof Date === 'undefined' ? 0 : Date.now())
        live.event = { seq: live.seq, ...event }
        post()
    }
    const columnAt = (x) => x - offset
    const within = (c) => c >= 0 && c < columns
    const clamp = (c) => Math.max(0, Math.min(columns - 1, c))
    client.onPointer((e) => {
        const c = columnAt(e.x)
        if (e.type === 'down' && e.button === 'left') {
            live.drag = { from: clamp(c), to: clamp(c) }
        } else if (e.type === 'move' && live.drag) {
            live.drag.to = clamp(c)
            live.hover = clamp(c)
        } else if (e.type === 'up' && live.drag) {
            const { from, to } = live.drag
            live.drag = null
            if (from !== to) send({ select: [from, to] })
        } else if (e.type === 'move') {
            const hover = within(c) ? c : null
            if (hover === live.hover) return
            live.hover = hover
            post()
        } else if (e.type === 'leave') {
            if (live.hover === null || live.drag) return
            live.hover = null
            post()
        } else return
        client.setState(live)
    })
    client.onKey((e) => {
        if (e.key === 'i' || e.key === '+' || e.key === '=') send({ zoom: 'in' })
        else if (e.key === 'o' || e.key === '-') send({ zoom: 'out' })
        else if (e.key === 'r') send({ zoom: 'reset' })
    })
    // Post the width only when it changed: a post on every draw would replace an undelivered one
    if (live.posted !== client.columns) {
        live.posted = client.columns
        post()
    }

    const colorOf = (i) => i >= 0 ? palette[i] : undefined
    const hover = live.drag ? null : live.hover
    // Lit with the hovered column: for bars, every column of its sample, so a bar or a group lights whole
    const lights = (c) => hover !== null && (group ? group[c] === group[hover] : c === hover)
    const [lo, hi] = live.drag ? [Math.min(live.drag.from, live.drag.to), Math.max(live.drag.from, live.drag.to)] : [-1, -1]
    // One row of a panel: its y axis, then its cells in runs of one look, so a row is a few Texts, not one a cell
    const row = (panel, r) => {
        const runs = []
        for (let c = 0; c < columns; c++) {
            const glyph = panel.text[r][c] ?? ' '
            const drawn = glyph !== ' '
            // A stacked bar's next segment shows behind the eighth block where this one ends
            const bg = drawn ? colorOf(panel.bg?.[r][c] ?? -1) : undefined
            const style = drawn
                ? lights(c) ? { color: lit[panel.color[r][c]] ?? 'text', bold: true, backgroundColor: bg } : { color: colorOf(panel.color[r][c]), backgroundColor: bg }
                : { dimColor: true }
            const text = drawn ? glyph : panel.grid[r] ? '┄' : ' '
            const last = runs[runs.length - 1]
            if (last && last.style.color === style.color && last.style.bold === style.bold && last.style.dimColor === style.dimColor && last.style.backgroundColor === style.backgroundColor) last.text += text
            else runs.push({ style, text })
        }
        const props = (style) => Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined))
        return Text({ children: [Text({ dimColor: true, children: [panel.axis[r]] }), ...runs.map(run => Text({ ...props(run.style), children: [run.text] }))] })
    }
    const axis = Text({
        children: [
            Text({ dimColor: true, children: [props.base ?? `${' '.repeat(labelWidth + 1)}└`] }),
            ...Array.from({ length: columns }, (_, c) =>
                c >= lo && c <= hi ? Text({ color: 'suggestion', children: ['━'] })
                : lights(c) ? Text({ bold: true, children: [ticks.includes(c) ? '┬' : '─'] })
                : Text({ dimColor: true, children: [ticks.includes(c) ? '┬' : '─'] })),
        ],
    })
    const shown = hover !== null && values[hover] ? values[hover] : null
    return Box({
        flexDirection: 'column',
        children: [
            ...(unit ? [Text({ dimColor: true, children: [unit.padStart(labelWidth)] })] : []),
            ...panels.flatMap((panel, i) => [
                ...(panel.head ? [Box({ flexDirection: 'row', marginTop: i ? 1 : 0, children: [
                    Text({ children: [' '.repeat(labelWidth + 2)] }),
                    Text({ color: colorOf(panel.head.color), children: ['━ '] }),
                    Text({ dimColor: true, children: [panel.head.name] }),
                ] })] : []),
                ...panel.text.map((_, r) => row(panel, r)),
            ]),
            axis,
            ...labels.map(row => Text({ dimColor: true, children: [row] })),
            // The card of the column under the pointer, beside it and inside the chart (timeseries.js cardLayout)
            ...(shown ? [Box({
                position: 'absolute',
                top: (unit ? 1 : 0) + 1,
                left: card.left[hover],
                width: card.width,
                flexDirection: 'column',
                borderStyle: 'round',
                borderDimColor: true,
                backgroundColor: 'inverseText',
                paddingX: 1,
                children: [
                    Box({ flexDirection: 'row', justifyContent: 'flex-end', children: [Text({ dimColor: true, wrap: 'truncate-end', children: [shown.time] })] }),
                    ...series.map((s, k) => Box({
                        flexDirection: 'row',
                        columnGap: 1,
                        children: [
                            Text({ color: colorOf(s.color), children: ['━'] }),
                            Box({ flexGrow: 1, flexShrink: 1, children: [Text({ dimColor: true, wrap: 'truncate-middle', children: [s.name] })] }),
                            Box({ flexShrink: 0, children: [Text({ bold: true, dimColor: shown.none[k], children: [shown.values[k].padStart(card.valueWidth)] })] }),
                        ],
                    })),
                ],
            })] : []),
        ],
    })
}
