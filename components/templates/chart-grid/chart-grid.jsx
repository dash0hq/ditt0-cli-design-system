import { el } from '../../elements.js'
import { measure, widthOf, keyFor, CHART_MAX } from '../../measure.js'

export { CHART_MAX }
// A chart in a ChartCard or a page's card: its border and padding, two cells each side
const CELL = CHART_MAX + 4

// Charts on a page, each about as wide as a chart reads best (CHART_MAX, about 500 px): as many columns as cells of
// that width fit, rounded, never more than there are charts. Every cell shares the width evenly, so the charts
// always fill it and grow with the pane, and a pane wide enough for one more chart near its best width splits into
// one more column. The last row keeps the others' width, short or not. Measured (measure.js): until then, and on
// mobile, the charts stack in one column.
// id: names the grid's measure region, unique on the page; columns: the most columns it takes (default, as many as
// fit); gap: cells between columns; children: the charts, or cards holding them
export function ChartGrid({ id, columns: most = Infinity, gap = 1, children }) {
    const ui = el()
    const items = [children].flat(Infinity).filter(Boolean)
    const key = keyFor('chart-grid', id)
    const width = widthOf(key)
    const columns = width ? Math.max(1, Math.min(items.length, most, Math.round((width + gap) / (CELL + gap)))) : 1
    const cell = width ? Math.floor((width - gap * (columns - 1)) / columns) : undefined
    const rows = Array.from({ length: Math.ceil(items.length / columns) }, (_, r) => items.slice(r * columns, (r + 1) * columns))
    return (
        <ui.Box flexDirection="column" rowGap={1}>
            {measure(key)}
            {rows.map(row => (
                <ui.Box flexDirection="row" columnGap={gap}>
                    {row.map(item => <ui.Box flexDirection="column" {...(cell ? { width: cell } : { flexGrow: 1 })}>{item}</ui.Box>)}
                </ui.Box>
            ))}
        </ui.Box>
    )
}
