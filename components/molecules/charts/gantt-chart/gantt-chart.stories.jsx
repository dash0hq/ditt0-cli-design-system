import { GanttChart } from './gantt-chart.jsx'

export default { title: 'Components/Charts/GanttChart', component: GanttChart }

// Days in local time, so every timezone ticks the same dates
const day = (month, date) => new Date(2026, month - 1, date).getTime()

// A release of the Ditt0 components, by phase: a section each, its tasks in its colour, the release a milestone
export const Default = {
    args: {
        tasks: [
            { section: 'Design', label: 'Tokens from Dash0', start: day(10, 5), end: day(10, 14) },
            { section: 'Design', label: 'Component specs', start: day(10, 12), end: day(10, 23) },
            { section: 'Build', label: 'FlowDiagram', start: day(10, 19), end: day(10, 30) },
            { section: 'Build', label: 'GanttChart', start: day(10, 26), end: day(11, 6) },
            { section: 'Build', label: 'Table styles', start: day(11, 2), end: day(11, 9) },
            { section: 'Launch', label: 'Docs and the /book gallery', start: day(11, 9), end: day(11, 17) },
            { section: 'Launch', label: 'Ditt0 1.0', start: day(11, 18), milestone: true },
        ],
    },
}

// One trace's spans as tasks, a row per span in the order they started, coloured by service, the failed span in the
// error red (its span status, through the Color Manager). Under a minute, the axis reads the time since the first span
const at = new Date(2026, 9, 19, 16, 10, 0).getTime()
const span = (label, service, from, to, status) => ({
    label, series: service, start: at + from, end: at + to, ...(status ? { attributes: { 'otel.span.status.code': status } } : {}),
})
export const Waterfall = {
    args: {
        tasks: [
            span('GET /api/order', 'frontend', 0, 412),
            span('authenticate', 'api', 6, 31),
            span('POST /v1/login/verify', 'order-history-api', 10, 29),
            span('SELECT logins', 'postgres', 14, 24),
            span('GET cache order', 'redis', 33, 36, 'ERROR'),
            span('query order', 'api', 38, 398),
            span('SELECT FROM order', 'clickhouse', 44, 371),
            span('serialize response', 'api', 399, 409),
        ],
    },
}

// An incident on the clock: the moments it turned as milestones, the work between them as bars
const t = (hour, minute) => new Date(2026, 9, 19, hour, minute).getTime()
export const Milestones = {
    args: {
        tasks: [
            { label: 'Error rate over 5%', start: t(14, 2), milestone: true, attributes: { 'dash0.color': 'critical' } },
            { label: 'Check rule firing', start: t(14, 4), milestone: true, attributes: { 'dash0.color': 'attention' } },
            { label: 'Investigation', start: t(14, 6), end: t(14, 31) },
            { label: 'Rollback deploy', start: t(14, 31), end: t(14, 40) },
            { label: 'Resolved', start: t(14, 44), milestone: true, attributes: { 'dash0.color': 'info' } },
        ],
    },
}

export const NoData = { args: { tasks: [] } }
