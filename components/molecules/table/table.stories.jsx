import { Table } from './table.jsx'
import { requestRates24h } from '../../../fixtures/dash0-24h.js'

export default { title: 'Components/Data/Table', component: Table }

// Every service in fixtures/dash0-24h.js: its requests per second at the day's first and last sample, and its
// peak. Names left, numbers right, each value one line
const last = (values) => [...values].reverse().find(v => v !== null) ?? null
const first = (values) => values.find(v => v !== null) ?? null
const rate = (v) => v === null ? 'no data' : `${Number(v.toPrecision(v >= 10 ? 3 : 2))}/s`
const services = requestRates24h.map(s => ({
    service: s.name,
    first: rate(first(s.values)),
    last: rate(last(s.values)),
    peak: rate(Math.max(...s.values.filter(v => v !== null))),
}))
export const Default = {
    args: {
        columns: [
            { key: 'service', label: 'Service' },
            { key: 'first', label: '08:00', align: 'right' },
            { key: 'last', label: '07:40', align: 'right' },
            { key: 'peak', label: 'Peak', align: 'right' },
        ],
        rows: services,
    },
}

// The busiest services of the day, in each lined variant
const busiest = {
    columns: [
        { key: 'service', label: 'Service' },
        { key: 'last', label: '07:40', align: 'right' },
        { key: 'peak', label: 'Peak', align: 'right' },
    ],
    rows: services.slice(0, 5),
}

// Every cell boxed, a double rule under the header
export const Box = { args: { ...busiest, variant: 'box' } }

// A dim rule under the header and between rows
export const Rules = { args: { ...busiest, variant: 'rules' } }

// A heavy rule under the header, a dim one between rows, the columns further apart
export const Grid = { args: { ...busiest, variant: 'grid' } }

// Prose in a box: each value wraps in its column, the bars running down every line of the row
export const BoxWrapped = {
    args: {
        variant: 'box',
        wrap: true,
        columns: [
            { key: 'variant', label: 'Variant' },
            { key: 'what', label: 'What it draws' },
        ],
        rows: [
            { variant: '`minimal`', what: 'A dim rule under the header, nothing between rows: the default, for most tables' },
            { variant: '`rules`', what: 'A dim rule under the header and between rows, for rows that run long' },
            { variant: '`grid`', what: 'A heavy rule under the header, dim ones between rows, the columns further apart' },
            { variant: '`box`', what: 'Every cell boxed, a double rule under the header, for a table that stands alone' },
        ],
    },
}

// Prose in cells, as a doc page's props table: wrap, a dim rule between rows
export const Wrapped = {
    args: {
        wrap: true,
        columns: [
            { key: 'prop', label: 'Prop' },
            { key: 'type', label: 'Type' },
            { key: 'what', label: 'What it does' },
        ],
        rows: [
            { prop: '`zoom`', type: 'string', what: 'While zoomed in, the span shown, such as `05:00–06:00`: drawn as the selected range in the ranges\' place, with a Reset zoom button' },
            { prop: '`addZoomControl`', type: 'boolean', what: 'Adds − and + at the far right, for zooming without a drag' },
            { prop: '`actions`', type: 'elements', what: 'Under the chart, in a row, such as a Link to Dash0' },
        ],
    },
}
