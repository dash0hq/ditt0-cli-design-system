// The inputs both libraries draw for the goldens: the JS components here (render.js), the Go package in its test
// (go/ditt0/golden_test.go), from cases.json, which scripts/export-goldens.mjs writes from this list. Plain data only,
// so Go reads the same numbers: every value is rounded to two decimals here, and JSON carries it exactly.

// A wave, values rounded to two decimals; gaps: indices left null, a gap in the samples
const wave = (n, { base = 0, amp = 1, period = 12, phase = 0, gaps = [] } = {}) =>
    Array.from({ length: n }, (_, i) => gaps.includes(i) ? null : Math.round((base + amp * Math.sin((i + phase) * 2 * Math.PI / period)) * 100) / 100)

// HH:MM labels, a sample every step minutes from 10:00
const clock = (n, step = 5) => Array.from({ length: n }, (_, i) => {
    const m = 600 + i * step
    return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})

const PURPLE = '#828aff'
const TEAL = '#2fd4c6'
const ORANGE = '#ff9a3c'
const PINK = '#f06292'

// kind: which component; width: the cells it is drawn in (Timeseries measures it; 0, unmeasured)
export const CASES = [
    // Timeseries: gaps, stretched and folded columns, small multiples, one axis, and each kind of unit
    { name: 'timeseries-gaps', kind: 'timeseries', width: 48, props: { unit: 'ms', timeLabel: 'UTC', times: clock(12), series: [{ name: 'p99 latency', color: PURPLE, values: wave(12, { base: 120, amp: 60, gaps: [4, 5, 9] }) }] } },
    { name: 'timeseries-stretched', kind: 'timeseries', width: 60, props: { unit: 'seconds', timeLabel: 'UTC', times: clock(7, 10), series: [{ name: 'duration', color: TEAL, values: [0.42, 0.85, null, 1.3, 0.95, 0.6, 0.71] }] } },
    { name: 'timeseries-folded', kind: 'timeseries', width: 40, props: { unit: 'percent', timeLabel: 'UTC', times: clock(90, 1), series: [{ name: 'cpu', color: ORANGE, values: wave(90, { base: 55, amp: 30, period: 40 }) }] } },
    { name: 'timeseries-bytes', kind: 'timeseries', width: 64, props: { unit: 'bytes', timeLabel: 'UTC', times: clock(24), series: [
        { name: 'memory usage', color: PURPLE, values: wave(24, { base: 7.2e8, amp: 1.5e8, period: 16 }) },
        { name: 'memory request', color: TEAL, values: Array(24).fill(1e9) },
    ] } },
    { name: 'timeseries-cores', kind: 'timeseries', width: 56, props: { unit: 'cores', timeLabel: 'UTC', times: clock(20), series: [
        { name: 'usage', color: ORANGE, values: wave(20, { base: 1.2, amp: 0.5, period: 10 }) },
        { name: 'limit', color: PINK, values: Array(20).fill(2) },
    ] } },
    { name: 'timeseries-multiples', kind: 'timeseries', width: 60, props: { unit: '/s', timeLabel: 'UTC', times: clock(30), series: [
        { name: 'OK', color: TEAL, values: wave(30, { base: 25000, amp: 4000, period: 15 }) },
        { name: 'ERROR', color: PINK, values: wave(30, { base: 600, amp: 200, period: 10, gaps: [12] }) },
    ] } },
    { name: 'timeseries-one-axis', kind: 'timeseries', width: 60, props: { unit: '/s', timeLabel: 'UTC', multiples: false, times: clock(30), series: [
        { name: 'OK', color: TEAL, values: wave(30, { base: 25000, amp: 4000, period: 15 }) },
        { name: 'ERROR', color: PINK, values: wave(30, { base: 600, amp: 200, period: 10, gaps: [12] }) },
    ] } },
    { name: 'timeseries-four', kind: 'timeseries', width: 50, props: { unit: 'percent', timeLabel: 'UTC', times: clock(16), series: [
        { name: 'checkout', color: PURPLE, values: wave(16, { base: 40, amp: 10, period: 8 }) },
        { name: 'cart', color: TEAL, values: wave(16, { base: 35, amp: 12, period: 8, phase: 2 }) },
        { name: 'payment', color: ORANGE, values: wave(16, { base: 50, amp: 8, period: 8, phase: 4 }) },
        { name: 'gcp-warehouse-sync-tasks-worker', color: PINK, values: wave(16, { base: 45, amp: 6, period: 8, phase: 6 }) },
    ] } },
    { name: 'timeseries-unmeasured', kind: 'timeseries', width: 0, props: { unit: '', times: clock(10), series: [{ name: 'requests', color: PURPLE, values: wave(10, { base: 12500, amp: 3000, period: 6 }) }] } },
    // Timeseries in braille dots: gaps, fewer samples than dot columns, more, lines that cross, small multiples
    { name: 'braille-gaps', kind: 'timeseries', width: 48, props: { lineType: 'braille', unit: 'ms', timeLabel: 'UTC', times: clock(12), series: [{ name: 'p99 latency', color: PURPLE, values: wave(12, { base: 120, amp: 60, gaps: [4, 5, 9] }) }] } },
    { name: 'braille-stretched', kind: 'timeseries', width: 60, props: { lineType: 'braille', unit: 'seconds', timeLabel: 'UTC', times: clock(7, 10), series: [{ name: 'duration', color: TEAL, values: [0.42, 0.85, null, 1.3, 0.95, 0.6, 0.71] }] } },
    { name: 'braille-folded', kind: 'timeseries', width: 40, props: { lineType: 'braille', unit: 'percent', timeLabel: 'UTC', times: clock(300, 1), series: [{ name: 'cpu', color: ORANGE, values: wave(300, { base: 55, amp: 30, period: 40, gaps: [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131] }) }] } },
    { name: 'braille-crossing', kind: 'timeseries', width: 56, props: { lineType: 'braille', unit: 'cores', timeLabel: 'UTC', times: clock(40), series: [
        { name: 'usage', color: ORANGE, values: wave(40, { base: 1.2, amp: 0.9, period: 10 }) },
        { name: 'request', color: TEAL, values: wave(40, { base: 1.2, amp: 0.6, period: 14, phase: 5 }) },
        { name: 'limit', color: PINK, values: Array(40).fill(2) },
    ] } },
    { name: 'braille-multiples', kind: 'timeseries', width: 60, props: { lineType: 'braille', unit: '/s', timeLabel: 'UTC', times: clock(30), series: [
        { name: 'OK', color: TEAL, values: wave(30, { base: 25000, amp: 4000, period: 15 }) },
        { name: 'ERROR', color: PINK, values: wave(30, { base: 600, amp: 200, period: 10, gaps: [12] }) },
    ] } },
    { name: 'braille-unmeasured', kind: 'timeseries', width: 0, props: { lineType: 'braille', unit: '', times: clock(10), series: [{ name: 'requests', color: PURPLE, values: wave(10, { base: 12500, amp: 3000, period: 6 }) }] } },
    // Stat: up and down against previous, good either way, no data, decimals, a threshold, a count
    { name: 'stat-up', kind: 'stat', props: { label: 'p99 latency', unit: 'ms', values: wave(20, { base: 150, amp: 40, period: 9 }), previous: 120, compareLabel: 'vs 1h ago', goodWhen: 'down' } },
    { name: 'stat-down', kind: 'stat', props: { label: 'Requests', unit: '/s', values: wave(20, { base: 13000, amp: 2500, period: 7 }), previous: 16000 } },
    { name: 'stat-nil', kind: 'stat', props: { label: 'Errors', unit: '/s', values: [null, null, null], previous: 3 } },
    { name: 'stat-decimals', kind: 'stat', props: { label: 'Duration', unit: 'seconds', values: [0.91, 0.88, 0.8359], previous: 0.8359 } },
    { name: 'stat-threshold', kind: 'stat', props: { label: 'Error rate', unit: 'percent', values: [1.2, 3.4, 7.25], thresholds: [{ value: 0, color: 'healthy' }, { value: 5, color: 'error' }] } },
    { name: 'stat-bytes', kind: 'stat', props: { unit: 'bytes', values: [94711762944] } },
    // Sparkline: gaps, flat, more values than cells
    { name: 'sparkline-gaps', kind: 'sparkline', props: { values: [1, 3, null, 7, 5, 2, null, null, 4, 8] } },
    { name: 'sparkline-flat', kind: 'sparkline', props: { values: [5, 5, 5, 5] } },
    { name: 'sparkline-folded', kind: 'sparkline', props: { values: wave(75, { base: 10, amp: 4, period: 25 }), width: 30 } },
    // ChartControls: a row of ranges, one selected
    { name: 'controls-ranges', kind: 'controls', width: 60, props: { ranges: [{ value: '1h', label: '1h' }, { value: '6h', label: '6h' }, { value: '24h', label: '24h' }], range: '6h' } },
    { name: 'controls-live', kind: 'controls', width: 60, props: { ranges: [{ value: '15m', label: '15m' }, { value: '1h', label: '1h' }, { value: '6h', label: '6h' }, { value: '24h', label: '24h' }], range: '15m' } },
    // Button: an action, and a toggle on and off
    { name: 'button-action', kind: 'button', props: { label: 'Refresh' } },
    { name: 'button-selected', kind: 'button', props: { label: '1h', selected: true } },
    { name: 'button-unselected', kind: 'button', props: { label: '6h', selected: false } },
]
