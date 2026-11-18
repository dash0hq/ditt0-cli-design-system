import { theme } from '../../elements.js'
import { palette, seriesUnset, status } from '../tokens/tokens.js'

// Dash0's color manager for the terminal: every chart takes its series colours from here, never from an index.
// A series' colour follows its name (the same name is the same colour in every chart), and its attributes
// can override that with a meaning: an ERROR span status, a 5xx, an error.type is the error red whatever its order.
// It follows the color manager of Dash0's web design system.
//
// Left out: Dash0 keeps assignments in localStorage for two days and forgets the oldest past 200 per palette.
// Here they last as long as the mod is loaded

// The order the auto palette is handed out in, by its slot in the palette. Dash0 measured it so neighbours stay apart
const AUTO_ORDER = [0, 1, 7, 4, 8, 6, 2, 3, 5]
// Once all nine are taken, each slot again at these brightnesses, one brightness across all nine at a time
const AUTO_BRIGHTNESS = [-0.15, -0.3, 0.45, 0.15, -0.45, 0.3]
// The other palettes brighten a clashing colour by up to this many steps of 0.3
const MAX_BRIGHTEN_STEPS = 6
// What a brightness amount is scaled by (modify-color-brightness.css): far less in the light theme
const BRIGHTNESS_FACTOR = { dark: 0.3, light: 0.1 }
// Legend formatters name a series with no value for its label this way
const UNSET_KEY = '{{unset}}'

// Named palettes a Dash0 panel can pick (get-named-color-palettes.ts), the d3 ones as d3 defines them
const D3 = {
    schemeTableau10: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'],
    schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
    schemeDark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
}
D3.categorical = D3.schemeTableau10

// A palette's base colours for the theme, in the order they are handed out
const baseColors = (name) => name === 'auto' ? AUTO_ORDER.map(i => palette().series[i]) : D3[name] ?? D3.categorical

// --- Brightness, as CSS's oklch(from c calc(l * (1 + factor * amount)) c h) does it, clipped to sRGB

const toLinear = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const toGamma = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
const brighten = (hex, amount) => {
    if (!amount) return hex
    const [r, g, b] = [1, 3, 5].map(i => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255))
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const L = (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * (1 + BRIGHTNESS_FACTOR[theme()] * amount)
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    const l2 = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
    const m2 = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
    const s2 = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
    const rgb = [
        4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2,
        -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2,
        -0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2,
    ]
    return '#' + rgb.map(c => Math.round(Math.min(1, Math.max(0, toGamma(Math.max(0, c)))) * 255).toString(16).padStart(2, '0')).join('')
}

// --- Semantic colour coding: what an attribute's value means, worst first

const RANK = ['critical', 'attention', 'info', 'default', 'unknown']
const worst = (a, b) => RANK.find(c => c === a || c === b)

const http = (v) => {
    const code = Number.parseInt(v)
    if (Number.isNaN(code)) return undefined
    if (code === 0) return 'critical'
    if (code >= 200 && code < 300) return 'default'
    if ((code >= 100 && code < 200) || (code >= 300 && code < 400)) return 'info'
    if (code >= 400 && code < 500) return 'attention'
    if (code >= 500) return 'critical'
}
// gRPC and Connect statuses only mean something for a known span kind; a metric series has none
const always = (coding) => () => coding
const lookup = (mapping) => (v) => mapping[String(v)]
const severity = lookup({ FATAL: 'critical', ERROR: 'critical', 'ERROR & FATAL': 'critical', WARN: 'attention', INFO: 'info', TRACE: 'default', DEBUG: 'default', UNKNOWN: 'unknown' })
const spanStatus = lookup({ UNSET: 'unknown', OK: 'default', ERROR: 'critical' })
const webSeverity = lookup({ UNSET: 'unknown', OK: 'info', DEGRADED: 'attention', CRITICAL: 'critical' })
const webStatus = lookup({ ERROR: 'critical', UNSET: 'unknown' })
const webEventName = lookup({ 'browser.error': 'critical', 'http.request.error': 'critical' })
const webVital = lookup({ POOR: 'critical', NEEDS_IMPROVEMENT: 'attention', GOOD: 'default', UNSET: 'unknown' })
const dash0Color = (v) => ({ fatal: 'critical', error: 'critical', critical: 'critical', attention: 'attention', warn: 'attention', info: 'info', default: 'default', unknown: 'unknown' })[String(v).toLowerCase()]
const overflow = (v) => v === true || v === 'true' ? 'attention' : 'default'

// OTel keys and their Prometheus spellings, as semantic-color-coding/sources/index.ts lists them
const CODERS = {
    'otel.log.severity.range': severity, otel_log_severity_range: severity,
    'otel.span.status.code': spanStatus, otel_span_status_code: spanStatus,
    'dash0.web.event.severity': webSeverity, dash0_web_event_severity: webSeverity,
    'dash0.web.event.status.code': webStatus, dash0_web_event_status_code: webStatus,
    'event.name': webEventName, event_name: webEventName,
    'http.response.status_code': http, http_response_status_code: http,
    'http.status_code': http, http_status_code: http,
    'rpc.jsonrpc.error_code': always('critical'), rpc_jsonrpc_error_code: always('critical'),
    'error.type': always('critical'), error_type: always('critical'),
    'exception.type': always('critical'), exception_type: always('critical'),
    'dash0.web.vital.rating': webVital, dash0_web_vital_rating: webVital,
    'dash0.color': dash0Color, dash0_color: dash0Color,
    'otel.metric.overflow': overflow, otel_metric_overflow: overflow,
    'count(error)': (v) => Number(v) > 0 ? 'critical' : 'default',
}

// What a series' attributes mean together: the worst any of them says
export const colorCoding = (attributes = {}) =>
    Object.keys(CODERS).reduce((coding, key) => key in attributes ? worst(coding, CODERS[key](attributes[key])) : coding, undefined)

// Each meaning's status colour (to-ordinal-color-scale-with-semantic-color-coding.ts)
const STATUS_OF = { critical: 'error', attention: 'warning', info: 'info', default: 'debug', unknown: 'unknown' }
// A series split by HTTP status alone draws its 2xx codes in seagull shades, darkest for 200 (http-success.ts)
const HTTP_2XX = { 200: '#5d6470', 201: '#838e9e', 202: '#a0aec2', 203: '#b9c8e0', 204: '#cfe0fa', 205: '#d9e7fb', 206: '#e3edfc', 207: '#edf3fd', 208: '#f6f9fe', 226: '#fbfcff' }
const HTTP_KEYS = ['http.response.status_code', 'http_response_status_code']

const semanticColor = (attributes) => {
    const coding = colorCoding(attributes)
    if (coding === undefined) return undefined
    const keys = Object.keys(attributes)
    if (coding === 'default' && keys.length === 1 && HTTP_KEYS.includes(keys[0])) return HTTP_2XX[attributes[keys[0]]] ?? HTTP_2XX[200]
    return status(STATUS_OF[coding]).bg
}

// --- Assignment. A colour is kept as its slot and brightness, not its hex, so a theme switch keeps every series' colour

// Dash0 orders by wall clock and breaks ties with a count; a counter does both here
let clock = 0

class PaletteAssignments {
    constructor(name) {
        this.name = name
        this.series = new Map()
        // Every slot handed out, by key: how recently and how often
        this.used = new Map()
    }

    get size() { return baseColors(this.name).length }

    color(seriesName) {
        let slot = this.series.get(seriesName)
        if (!slot) {
            slot = this.unused() ?? this.leastConflicting()
            this.mark(slot)
            this.series.set(seriesName, slot)
        }
        return brighten(baseColors(this.name)[slot.index], slot.amount)
    }

    key({ index, amount }) { return `${index}@${amount}` }
    inUse(slot) { return this.used.has(this.key(slot)) }
    mark(slot) {
        const usage = this.used.get(this.key(slot))
        if (usage) { usage.lastSeen = ++clock; usage.seenCount++ }
        else this.used.set(this.key(slot), { slot, lastSeen: ++clock, seenCount: 1 })
    }

    unused() {
        for (let index = 0; index < this.size; index++) if (!this.inUse({ index, amount: 0 })) return { index, amount: 0 }
    }

    leastConflicting() {
        if (this.name === 'auto') {
            for (const amount of AUTO_BRIGHTNESS) {
                for (let index = 0; index < this.size; index++) if (!this.inUse({ index, amount })) return { index, amount }
            }
        } else {
            const base = this.leastUsed(Array.from({ length: this.size }, (_, index) => this.key({ index, amount: 0 })))
            for (let i = 1; i <= MAX_BRIGHTEN_STEPS; i++) {
                const slot = { index: base.index, amount: Math.ceil(i / 2) * 0.3 }
                if (!this.inUse(slot)) { this.mark(base); return slot }
            }
        }
        // Everything is taken: the slot seen least
        return this.leastUsed(this.used.keys(), this.name === 'auto')
    }

    leastUsed(keys, byCount = false) {
        let best = null
        for (const key of keys) {
            const usage = this.used.get(key)
            if (!usage) continue
            if (!best
                || (byCount
                    ? usage.seenCount < best.seenCount || (usage.seenCount === best.seenCount && usage.lastSeen < best.lastSeen)
                    : usage.lastSeen < best.lastSeen || usage.seenCount < best.seenCount)) best = usage
        }
        return best.slot
    }
}

const assignments = new Map()

// The colour a series draws in. palette: 'auto' (Dash0's default), 'categorical', 'schemeTableau10',
// 'schemeCategory10' or 'schemeDark2', with or without Perses' dash0. prefix.
// attributes: the series' labels, { key: value }; only the auto palette reads meaning from them
export const getColor = (paletteName, seriesName, attributes) => {
    const name = paletteName.replace(/^dash0\./, '')
    if (name === 'auto') {
        const meaning = attributes && semanticColor(attributes)
        if (meaning) return meaning
        if (seriesName === '' || seriesName === UNSET_KEY) return seriesUnset()
    }
    if (!assignments.has(name)) assignments.set(name, new PaletteAssignments(name))
    return assignments.get(name).color(seriesName)
}

// Forget every assignment, as the Storybook story's "Clear local storage" does
export const resetColors = () => assignments.clear()
