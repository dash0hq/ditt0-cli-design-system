import { Table } from '../../molecules/table/table.jsx'
import { getColor } from '../../foundations/color-manager/color-manager.js'
import { formatColumn } from '../../foundations/units/units.js'

const known = (values) => values.filter(v => v !== null && v !== undefined)
// The figures a column can show, from a series' values
const STATS = {
    current: { label: 'Current', of: (values) => [...values].reverse().find(v => v !== null && v !== undefined) ?? null },
    mean: { label: 'Mean', of: (values) => known(values).length ? known(values).reduce((a, v) => a + v, 0) / known(values).length : null },
    min: { label: 'Min', of: (values) => known(values).length ? Math.min(...known(values)) : null },
    max: { label: 'Max', of: (values) => known(values).length ? Math.max(...known(values)) : null },
}

// Each series of a chart as a row with its figures (Dash0's TimeSeriesTable panel): a swatch in the series' colour,
// its name, then its current value, mean and max, right-aligned, each column in one unit (UNIT-002). Rows run from
// the highest current value down, so what is biggest now is on top. A series' swatch is the colour the same series
// has in a line or bar chart, so the table can sit under one as its legend.
// series: [{ name, values, color, attributes }], values oldest first, as Timeseries takes them
// unit: as units.js formats it; stats: the figures, in order, of 'current', 'mean', 'min', 'max'
export function SeriesTable({ series, unit = '', palette = 'auto', stats = ['current', 'mean', 'max'] }) {
    const figures = series.map(s => Object.fromEntries(stats.map(k => [k, STATS[k].of(s.values)])))
    const order = series.map((_, i) => i).sort((a, b) => (figures[b].current ?? -Infinity) - (figures[a].current ?? -Infinity))
    const text = Object.fromEntries(stats.map(k => [k, formatColumn(order.map(i => figures[i][k]), unit)]))
    return Table({
        columns: [
            { key: 'swatch', label: '' },
            { key: 'name', label: 'Series' },
            ...stats.map(k => ({ key: k, label: STATS[k].label, align: 'right' })),
        ],
        rows: order.map((i, row) => ({
            swatch: { text: '━━', color: series[i].color ?? getColor(palette, series[i].name, series[i].attributes) },
            name: series[i].name,
            ...Object.fromEntries(stats.map(k => [k, text[k][row]])),
        })),
    })
}
