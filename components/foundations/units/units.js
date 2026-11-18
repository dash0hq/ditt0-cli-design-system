// Numbers with their units, as Dash0 writes them (content guidelines, UNIT-001 and UNIT-002): a space between the
// number and an abbreviation (12.5 ms, 3.2 GB), latency to 2 decimals at most, counts to 3 significant digits (12.5K).
// A unit scales to the size of the value: 1200 bytes is 1.2 kB, 0.00085 seconds is 850 μs.
// unit: one of UNITS, or any other string, appended after the number as it stands ('/s', 'spans')

// The units that scale, by the names Dash0's panels use (decimal, bytes, seconds, percent)
export const UNITS = ['decimal', 'bytes', 'bytes/s', 'seconds', 'milliseconds', 'percent', 'ratio']
// Their short names, as a query's result or a person writes them, so unit="ms" scales as milliseconds do (By is
// OpenTelemetry's bytes)
export const ALIASES = { ms: 'milliseconds', s: 'seconds', B: 'bytes', By: 'bytes', 'B/s': 'bytes/s', 'By/s': 'bytes/s', '%': 'percent' }
const idOf = (unit) => ALIASES[unit] ?? unit

// Whether values in this unit share one scale wherever they sit together: time, bytes and percent do (0.84 ms beside
// 699 ms, UNIT-002); a count doesn't, as 600 errors beside 2.5M spans would read 0.0006M
export const SHARED_SCALE = ['bytes', 'bytes/s', 'seconds', 'milliseconds', 'percent', 'ratio']
export const sharesScale = (unit = '') => SHARED_SCALE.includes(idOf(unit))

export const TIME = [[86400, 'd'], [3600, 'h'], [60, 'min'], [1, 's'], [1e-3, 'ms'], [1e-6, 'μs'], [1e-9, 'ns']]
export const BYTES = [[1e15, 'PB'], [1e12, 'TB'], [1e9, 'GB'], [1e6, 'MB'], [1e3, 'kB'], [1, 'B']]
export const COUNT = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K'], [1, '']]

// 3 significant digits, 2 decimals at most, no trailing zeros: 12.5, 850, 0.85
const digits = (n) => {
    const abs = Math.abs(n)
    const fixed = abs >= 100 ? 0 : abs >= 10 ? 1 : 2
    return String(Number(n.toFixed(fixed)))
}

// The step a value of this size is written in: [divisor, suffix, gap], gap the text between number and suffix
const STEPS = {
    decimal: COUNT.map(([d, s]) => [d, s, '']),
    bytes: BYTES.map(([d, s]) => [d, s, ' ']),
    'bytes/s': BYTES.map(([d, s]) => [d, `${s}/s`, ' ']),
    seconds: TIME.map(([d, s]) => [d, s, ' ']),
    milliseconds: TIME.map(([d, s]) => [d * 1e3, s, ' ']),
}

// The scale for values up to max, so every value of one axis or column shares a unit (UNIT-002):
// { divide, suffix } where a value is written as digits(value / divide) + suffix
export const scaleFor = (name = '', max = 0) => {
    const unit = idOf(name)
    const abs = Math.abs(max)
    if (unit === 'percent') return { divide: 1, suffix: '%' }
    if (unit === 'ratio') return { divide: 0.01, suffix: '%' }
    const steps = STEPS[unit] ?? COUNT.map(([d, s]) => [d, s + (unit ? (unit.startsWith('/') ? '' : ' ') + unit : ''), ''])
    // A count takes K from 10,000: 1128 reads 1128, not 1.13K, and its neighbours on an axis don't shrink to 0.07K
    const from = (d) => STEPS[unit] && unit !== 'decimal' ? d : d * 10
    const [divide, suffix, gap] = steps.find(([d]) => abs >= from(d)) ?? steps[steps.length - 1]
    return { divide, suffix: gap + suffix }
}

// One value with its unit, in its own scale, or in scale when given (scaleFor). null is 'no data'
export const formatValue = (value, unit = '', scale) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'no data'
    const { divide, suffix } = scale ?? scaleFor(unit, value)
    return digits(value / divide) + suffix
}

// A value's number alone, in a scale: for an axis, whose unit is written once, above it (unitLabel)
export const formatNumber = (value, scale) => digits(value / scale.divide)

// The unit's name as a scale writes it, for an axis label: the suffix values up to max share, trimmed
export const unitLabel = (unit = '', max = 0) => scaleFor(unit, max).suffix.trim()

// A column of values in one scale (UNIT-002), so 0.85 ms sits over 1.20 ms, not 850 μs over 1.2 ms: the scale of the
// column's middle value, so one outlier doesn't write the rest as 0.00 s. Counts still scale per value (12.5K over
// 850): K and M size a count, they aren't its unit
export const formatColumn = (values, unit = '') => {
    if (!(idOf(unit) in STEPS) || idOf(unit) === 'decimal') return values.map(v => formatValue(v, unit))
    const sorted = values.filter(v => v !== null && v !== undefined).map(Math.abs).sort((a, b) => a - b)
    const scale = scaleFor(unit, sorted[Math.floor(sorted.length / 2)] ?? 0)
    return values.map(v => formatValue(v, unit, scale))
}
