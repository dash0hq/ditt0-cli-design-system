import { parse as parseYaml } from '../vendor/yaml/yaml.js'
import { RANGES } from './dash0/overview.js'

// Perses dashboards as Ditt0 pages: a dashboard, upstream Perses or as Dash0 stores it, read into a Ditt0Page spec
// (connectors/spec-page.js) that draws each panel it can from Ditt0 components and asks Dash0 for its PromQL. Pure: no
// `$`, so a test checks every dashboard without a server. The Perses spec is perses.dev's; Dash0's dialect of it
// (dash0Extensions, its own query kinds, Grid titles) is Dash0's extension of the Perses spec.
// What can't draw here (a heatmap, a log table, a Dash0 structured query) is drawn as a card naming it, and listed in
// problems, so a panel is never dropped without a word

// A variable set to every value it has: in a label matcher it matches anything (=~".*")
export const ALL = '$__all'

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const str = (v) => typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)
const num = (v) => typeof v === 'number' && Number.isFinite(v) ? v : null

// A Perses duration, such as 30s, 5m, 1h, 7d or 1h30m, in ms; null when it isn't one
const DURATION_UNITS = { ms: 1, s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5, y: 31536e6 }
export const msOf = (text) => {
    const parts = [...str(text).trim().matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d|w|y)/g)]
    if (!parts.length || parts.map(p => p[0]).join('') !== str(text).trim()) return null
    return parts.reduce((ms, [, n, unit]) => ms + Number(n) * DURATION_UNITS[unit], 0)
}

// The page range a dashboard's duration opens on: the shortest Ditt0 range that holds it, else the longest
export const rangeOfDuration = (duration) => {
    const ms = msOf(duration)
    if (ms === null) return '1h'
    return (RANGES.find(r => r.ms >= ms) ?? RANGES[RANGES.length - 1]).value
}

// The dashboard in what was given, with what was wrong: an object, or its JSON or YAML text, bare or wrapped as Dash0
// answers it ({ dashboard, report } from its API, { persesDefinition } from its getDashboard tool)
export function readPerses(input) {
    let value = input
    if (typeof value === 'string') {
        const text = value.trim()
        if (!text) return { dashboard: null, problems: ['The Perses dashboard is empty'] }
        try {
            value = text.startsWith('{') ? JSON.parse(text) : parseYaml(text)
        } catch (err) {
            return { dashboard: null, problems: [`The Perses dashboard is not JSON or YAML: ${String(err?.message ?? err).split('\n')[0]}`] }
        }
    }
    if (isObject(value) && !isObject(value.spec)) {
        if (isObject(value.dashboard)) value = value.dashboard
        else if (isObject(value.persesDefinition)) value = value.persesDefinition
    }
    if (!isObject(value) || !isObject(value.spec)) return { dashboard: null, problems: ['A Perses dashboard is an object with a spec: { kind: "Dashboard", metadata, spec: { panels, layouts } }'] }
    const problems = []
    if (value.kind !== undefined && !['Dashboard', 'PersesDashboard'].includes(value.kind)) problems.push(`kind ${JSON.stringify(value.kind)} is not a Perses Dashboard; read as one`)
    return { dashboard: value, problems }
}

// What each variable is set to, by name: { values: string[] or ALL, shown }, shown how the page names its setting.
// given: { name: value, values or '$__all' }, what the person or Claude chose, over each variable's default.
// A list without a default takes its first static value; one whose values come from Prometheus (label values, a
// query) can't be listed here, so it matches everything, as Perses' "All" does
export function variablesOf(dashboard, given = {}) {
    const problems = []
    const vars = new Map()
    const asValues = (v) => v === ALL || v === '*' ? ALL : (Array.isArray(v) ? v : [v]).map(str).filter(x => x !== '')
    for (const variable of Array.isArray(dashboard?.spec?.variables) ? dashboard.spec.variables : []) {
        const spec = isObject(variable?.spec) ? variable.spec : {}
        const name = str(spec.name)
        if (!name) continue
        const kind = str(variable.kind)
        const plugin = isObject(spec.plugin) ? spec.plugin : {}
        let values = null
        if (kind === 'Dash0FilterVariable') continue
        if (Object.hasOwn(given, name)) values = asValues(given[name])
        else if (kind === 'TextVariable') values = [str(spec.value)]
        else if (kind === 'ListVariable') {
            const statics = (Array.isArray(plugin.spec?.values) ? plugin.spec.values : []).map(v => isObject(v) ? str(v.value) : str(v)).filter(Boolean)
            if (spec.defaultValue !== undefined && spec.defaultValue !== null && spec.defaultValue !== '') values = asValues(spec.defaultValue)
            else if (plugin.kind === 'StaticListVariable' && statics.length) values = [statics[0]]
            else values = ALL
        } else {
            problems.push(`variable ${name}: ${kind || 'a variable without a kind'} is not one this page reads; it matches everything`)
            values = ALL
        }
        if (Array.isArray(values) && !values.length) values = ALL
        vars.set(name, { values, shown: values === ALL ? 'All' : values.join(', ') })
    }
    for (const name of Object.keys(given)) if (!vars.has(name)) problems.push(`variable ${name}: the dashboard has no such variable`)
    return { vars, problems }
}

// A string as PromQL writes it between double quotes, and a regex matching it alone
const ESCAPES = { '\\': '\\\\', '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t' }
const quoted = (s) => s.replace(/[\\"\n\r\t]/g, c => ESCAPES[c])
const regexOf = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// A matcher's string as written, its escapes undone
const UNESCAPES = { n: '\n', r: '\r', t: '\t' }
const unquoted = (s) => s.replace(/\\(.)/g, (_, c) => UNESCAPES[c] ?? c)

// A variable's values as a format writes them: Perses' and Grafana's names for them
const formatted = (values, format) => {
    switch (format) {
        case 'regex': return values.length === 1 ? regexOf(values[0]) : `(${values.map(regexOf).join('|')})`
        case 'pipe': return values.join('|')
        case 'json': return JSON.stringify(values)
        case 'singlevariablevalue': return values[0]
        default: return values.join(',')
    }
}

// The references a query makes to variables: $name, ${name}, ${name:format} and [[name]]. Built-ins ($__interval,
// $__rate_interval, $__range) are the page's, put in at each refresh (spec-page.js)
const REFERENCE = /\$\{([A-Za-z_]\w*)(?::(\w+))?\}|\[\[([A-Za-z_]\w*)(?::(\w+))?\]\]|\$([A-Za-z_]\w*)/g
const nameOf = (m) => m[1] ?? m[3] ?? m[5]
const formatOf = (m) => m[2] ?? m[4]
const isBuiltin = (name) => name.startsWith('__')

// A PromQL query with the dashboard's variables put in: { query, unknown }, unknown the names no variable sets.
// In a label matcher a variable set to one value goes in as written; set to several, or All, the matcher turns into
// a regex one (= to =~, != to !~) matching any of them, or anything, as Perses does. Elsewhere (a range [$window], a
// by ($label)) its values go in as written, joined by commas; one set to All, or to nothing, stays as written
export function interpolate(query, vars) {
    const unknown = new Set()
    const valuesOf = (name) => {
        if (vars.has(name)) return vars.get(name).values
        unknown.add(name)
        return ALL
    }
    // Matchers first: label op "value" whose value refers to a variable
    const matched = str(query).replace(/([A-Za-z_][\w.]*|"(?:[^"\\]|\\.)*")(\s*)(=~|!~|!=|=)(\s*)"((?:[^"\\]|\\.)*)"/g, (whole, label, s1, op, s2, value) => {
        const refs = [...value.matchAll(REFERENCE)].filter(m => !isBuiltin(nameOf(m)))
        if (!refs.length) return whole
        const isRegex = op === '=~' || op === '!~'
        const single = refs.every(m => {
            if (formatOf(m)) return true
            const v = valuesOf(nameOf(m))
            return v !== ALL && v.length === 1
        })
        const toRegex = !isRegex && !single
        // The literal text around references: as written, or matched exactly once the matcher is a regex one
        const literal = (text) => toRegex ? quoted(regexOf(unquoted(text))) : text
        let out = ''
        let at = 0
        for (const m of refs) {
            out += literal(value.slice(at, m.index))
            const values = valuesOf(nameOf(m))
            if (values === ALL) out += quoted('.*')
            else if (formatOf(m)) out += quoted(formatted(values, formatOf(m)))
            else if (isRegex || toRegex) out += quoted(values.length === 1 ? regexOf(values[0]) : `(${values.map(regexOf).join('|')})`)
            else out += quoted(values[0])
            at = m.index + m[0].length
        }
        out += literal(value.slice(at))
        // Anchored: Prometheus anchors a regex matcher, Dash0 matches it anywhere in the value (=~"agents" matches
        // agents-worker), so a variable's values match whole on both. One reference alone needs no group of its own
        const alone = refs.length === 1 && refs[0].index === 0 && refs[0][0].length === value.length && [undefined, 'regex'].includes(formatOf(refs[0]))
        if (isRegex || toRegex) out = /^\^.*\$$/.test(out) ? out : alone ? `^${out}$` : `^(${out})$`
        return `${label}${s1}${toRegex ? (op === '=' ? '=~' : '!~') : op}${s2}"${out}"`
    })
    // Then the rest: values as written
    const out = matched.replace(REFERENCE, (whole, ...m) => {
        const name = m[0] ?? m[2] ?? m[4]
        if (isBuiltin(name)) return whole
        const values = valuesOf(name)
        if (values === ALL) { unknown.add(name); return whole }
        return formatted(values, m[1] ?? m[3])
    })
    return { query: out, unknown: [...unknown] }
}

// The Ditt0 unit for a Perses or Dash0 format's unit, and how a query's values become it: a time in ns or μs is
// divided, one in minutes, hours, days or weeks multiplied, into seconds (Ditt0 scales seconds from ns up to days)
const TIME_TO_SECONDS = {
    nanosecond: '/ 1000000000', nanoseconds: '/ 1000000000', ns: '/ 1000000000', microsecond: '/ 1000000', microseconds: '/ 1000000', µs: '/ 1000000',
    minute: '* 60', minutes: '* 60', hour: '* 3600', hours: '* 3600', day: '* 86400', days: '* 86400', week: '* 604800', weeks: '* 604800',
}
export const unitOfFormat = (format) => {
    const unit = str(isObject(format) ? format.unit : format).trim()
    if (!unit || unit === 'decimal' || unit === 'short') return { unit: '' }
    if (unit === 'percent' || unit === '%') return { unit: 'percent' }
    if (unit === 'percent-decimal' || unit === 'percentunit') return { unit: 'ratio' }
    if (unit === 'seconds' || unit === 'second' || unit === 's') return { unit: 'seconds' }
    if (unit === 'milliseconds' || unit === 'millisecond' || unit === 'ms') return { unit: 'milliseconds' }
    if (TIME_TO_SECONDS[unit]) return { unit: 'seconds', convert: TIME_TO_SECONDS[unit] }
    if (['bytes', 'decbytes', 'bytes-binary'].includes(unit)) return { unit: 'bytes' }
    if (['bytes/s', 'bytes/sec', 'decbytes/sec', 'Bps'].includes(unit)) return { unit: 'bytes/s' }
    if (['bits/sec', 'decbits/sec', 'bps'].includes(unit)) return { unit: 'bits/s' }
    const perSecond = unit.match(/^(\w+)\/sec$/)
    if (perSecond) return { unit: `${perSecond[1]}/s` }
    const currency = unit.match(/^currency-(\w+)$/)
    if (currency) return { unit: currency[1].toUpperCase() }
    if (unit === 'celsius') return { unit: '°C' }
    if (unit === 'fahrenheit') return { unit: '°F' }
    return { unit }
}

// The Ditt0 status a threshold's colour means: its name, or its hue (a hex or rgb()), else its place (the last step
// is the worst). Ditt0 takes no colour from a spec: a status draws in the theme's own colour for it
const NAMED = {
    healthy: ['green', 'lime', 'olive', 'teal', 'darkgreen', 'dark-green', 'semi-dark-green', 'light-green'],
    warning: ['yellow', 'orange', 'amber', 'gold', 'darkorange', 'dark-orange', 'dark-yellow', 'light-orange', 'semi-dark-orange'],
    error: ['red', 'crimson', 'darkred', 'maroon', 'dark-red', 'semi-dark-red', 'light-red', 'firebrick'],
    info: ['blue', 'cyan', 'sky', 'navy', 'dark-blue', 'light-blue', 'purple', 'violet'],
    unknown: ['grey', 'gray', 'transparent', 'white', 'black'],
}
const hueOf = (color) => {
    const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
    const rgb = hex
        ? (hex.length === 3 ? [...hex].map(c => parseInt(c + c, 16)) : [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)))
        : color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)?.slice(1, 4).map(Number)
    if (!rgb) return null
    const [r, g, b] = rgb.map(v => v / 255)
    const max = Math.max(r, g, b)
    const d = max - Math.min(r, g, b)
    // Grey: no hue to read
    if (d < 0.1) return -1
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    return (h * 60 + 360) % 360
}
export const statusOfColor = (color, index, count) => {
    const name = str(color).trim().toLowerCase()
    for (const [status, names] of Object.entries(NAMED)) if (names.includes(name)) return status
    const hue = hueOf(name)
    if (hue === -1) return 'unknown'
    if (hue !== null) return hue < 20 || hue >= 330 ? 'error' : hue < 70 ? 'warning' : hue < 170 ? 'healthy' : 'info'
    return index === count - 1 ? 'error' : 'warning'
}

// A panel's thresholds as Ditt0 takes them, [{ value, color: status }]; steps in percent of max need a max
const thresholdsOf = (thresholds, max, where, problems) => {
    if (!isObject(thresholds) || !Array.isArray(thresholds.steps)) return undefined
    const steps = thresholds.steps.filter(s => isObject(s) && num(s.value) !== null)
    const percent = thresholds.mode === 'percent'
    const top = num(thresholds.max) ?? max
    if (percent && top === null) {
        problems.push(`${where}: its thresholds are percentages of a max it doesn't give; left out`)
        return undefined
    }
    const out = steps.map((s, i) => ({ value: percent ? top * s.value / 100 : s.value, color: statusOfColor(s.color, i, steps.length) }))
    return out.length ? out : undefined
}

// Perses' calculations reduce a series to one value; Dash0's instant is its last
export const CALCULATIONS = ['first', 'last', 'first-number', 'last-number', 'mean', 'sum', 'min', 'max']
const calculationOf = (c) => CALCULATIONS.includes(c) ? c : 'last'

// A block id from a panel's key: letters, digits, _ and -, unique on the page
const idFor = (panelKey, taken) => {
    const base = `p-${str(panelKey).replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 48) || 'panel'}`
    let id = base
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`
    taken.add(id)
    return id
}

// The query kind Dash0's PromQL runs; Dash0's own (Spans, Services, Logs, Metrics, WebEvents) are its structured
// queries, which no MCP tool runs
const PROMQL_KINDS = ['PrometheusTimeSeriesQuery']
// The panel kinds drawn here
const DRAWN = ['TimeSeriesChart', 'StatChart', 'GaugeChart', 'PieChart', 'BarChart', 'TimeSeriesTable', 'Table', 'Markdown']

// A card in a panel's place, saying why it doesn't draw here
const notDrawn = (id, title, why) => ({ type: 'card', id, title, blocks: [{ type: 'text', color: 'subtle', text: why }] })

// One panel as a Ditt0 block. ctx: { vars, problems, unknown, taken }
function blockOf(panelKey, panel, ctx) {
    const spec = isObject(panel?.spec) ? panel.spec : {}
    const title = str(spec.display?.name) || str(panelKey)
    const where = `panel ${title}`
    const plugin = isObject(spec.plugin) ? spec.plugin : {}
    const queries = Array.isArray(spec.queries) ? spec.queries : []
    // A panel without a plugin that has queries is drawn as the time series Perses defaults to
    const kind = str(plugin.kind) || (queries.length ? 'TimeSeriesChart' : '')
    const options = isObject(plugin.spec) ? plugin.spec : {}
    const id = idFor(panelKey, ctx.taken)

    if (kind === 'Markdown') return { type: 'markdown', id, ...(spec.display?.name ? { title } : {}), text: str(options.text) }
    if (!DRAWN.includes(kind)) {
        ctx.problems.push(`${where}: ${kind || 'a panel without a kind'} panels don't draw here`)
        return notDrawn(id, title, `${kind || 'This'} panels don't draw in the terminal.`)
    }

    // The queries Dash0's PromQL runs, the variables put in, each with a name for its series
    const { unit, convert } = unitOfFormat(isObject(options.yAxis?.format) ? options.yAxis.format : options.format)
    const runnable = []
    const others = new Set()
    for (const query of queries) {
        const q = isObject(query?.spec?.plugin) ? query.spec.plugin : {}
        const qspec = isObject(q.spec) ? q.spec : {}
        if (qspec.hidden === true || query?.spec?.hidden === true) continue
        if (!PROMQL_KINDS.includes(q.kind)) { others.add(str(q.kind) || 'a query without a kind'); continue }
        const text = str(qspec.query).trim()
        if (!text) continue
        const { query: promql, unknown } = interpolate(text, ctx.vars)
        unknown.forEach(name => ctx.unknown.add(name))
        runnable.push({ promql: convert ? `(${promql}) ${convert}` : promql, ...(str(qspec.seriesNameFormat) ? { name: str(qspec.seriesNameFormat) } : {}) })
    }
    const named = [...others].join(', ')
    if (others.size) ctx.problems.push(`${where}: ${named} ${others.size === 1 ? 'is' : 'are'} not PromQL; ${runnable.length ? 'drawn without it' : 'not drawn'}`)
    if (!runnable.length) return notDrawn(id, title, others.size ? `Its ${named} doesn't run in the terminal.` : 'This panel has no query.')

    const calculation = calculationOf(options.calculation)
    const base = { id, title, queries: runnable, ...(unit ? { unit } : {}) }
    // Upstream options a terminal chart draws another way: said, as Dash0's own migration says them
    if (num(options.yAxis?.logBase) !== null || options.dash0Extensions?.yAxis?.scale === 'symlog') ctx.problems.push(`${where}: its log scale draws linear`)
    if (options.visual?.stack === 'percent') ctx.problems.push(`${where}: stacked to 100% upstream, stacked by value here`)
    switch (kind) {
        case 'TimeSeriesChart': return {
            type: 'timeseries', ...base,
            ...(options.visual?.display === 'bar' ? { lineType: 'bars' } : {}),
            ...(options.visual?.stack && options.visual.stack !== 'none' ? { stacked: true } : {}),
        }
        case 'StatChart': {
            const thresholds = thresholdsOf(options.thresholds, null, where, ctx.problems)
            return { type: 'stats', id: `${id}-stats`, items: [{ id, label: title, queries: runnable, calculation, ...(unit ? { unit } : {}), ...(thresholds ? { thresholds } : {}) }] }
        }
        case 'GaugeChart': {
            const max = num(options.max) ?? num(options.thresholds?.max)
            const thresholds = thresholdsOf(options.thresholds, max ?? (unit === 'percent' ? 100 : unit === 'ratio' ? 1 : null), where, ctx.problems)
            return { type: 'gauge', ...base, calculation, ...(max !== null ? { max } : {}), ...(thresholds ? { thresholds } : {}) }
        }
        case 'PieChart': return { type: 'pie', ...base, calculation }
        case 'BarChart': return { type: 'bars', ...base, calculation, orientation: 'horizontal' }
        default: return { type: 'table', ...base, calculation }
    }
}

// A JSON pointer's panel key: #/spec/panels/<key>, ~1 a slash and ~0 a tilde in it
const panelKeyOf = (ref) => {
    const m = str(ref).match(/^#\/spec\/panels\/(.+)$/)
    return m ? m[1].replace(/~1/g, '/').replace(/~0/g, '~') : null
}

// Blocks laid out as a grid lays them, by row (y), left to right (x). Several in a row sit side by side; stats in a
// row join into one row of headline numbers
const rowOf = (blocks) => {
    if (blocks.length === 1) return blocks[0]
    if (blocks.every(b => b.type === 'stats')) return { type: 'stats', id: blocks[0].id, items: blocks.flatMap(b => b.items) }
    return { type: 'row', blocks }
}

// The Ditt0Page for a Perses dashboard, with what was left out or read loosely.
// options: id (default perses-<its name>), title, variables ({ name: value, values or '$__all' }, over the
// defaults), range (default the dashboard's duration), href (Open in Dash0, for the dashboard), and server, dataset and
// refreshMs, passed on. spec is null when the input isn't a dashboard, and problems says why
export function persesPage(input, options = {}) {
    const { dashboard, problems } = readPerses(input)
    if (!dashboard) return { spec: null, problems }
    const spec = dashboard.spec
    const panels = isObject(spec.panels) ? spec.panels : {}
    const { vars, problems: varProblems } = variablesOf(dashboard, isObject(options.variables) ? options.variables : {})
    problems.push(...varProblems)
    const ctx = { vars, problems, unknown: new Set(), taken: new Set() }

    const blocks = []
    const used = new Set()
    const layouts = Array.isArray(spec.layouts) ? spec.layouts : []
    for (const [i, layout] of layouts.entries()) {
        if (layout?.kind !== 'Grid') { problems.push(`layout ${i}: ${str(layout?.kind) || 'a layout without a kind'} is not a Grid; its panels go at the end`); continue }
        const items = (Array.isArray(layout.spec?.items) ? layout.spec.items : []).filter(isObject)
        const section = str(layout.spec?.display?.title)
        const drawn = []
        for (const item of [...items].sort((a, b) => (num(a.y) ?? 0) - (num(b.y) ?? 0) || (num(a.x) ?? 0) - (num(b.x) ?? 0))) {
            const key = panelKeyOf(item.content?.$ref)
            if (key === null || !Object.hasOwn(panels, key)) { problems.push(`layout ${section || i}: ${str(item.content?.$ref) || 'an item'} names no panel`); continue }
            used.add(key)
            drawn.push({ y: num(item.y) ?? 0, block: blockOf(key, panels[key], ctx) })
        }
        if (!drawn.length) continue
        if (section) blocks.push({ type: 'heading', text: section, level: 'h3' })
        const rows = []
        for (const { y, block } of drawn) {
            if (rows.length && rows[rows.length - 1].y === y) rows[rows.length - 1].blocks.push(block)
            else rows.push({ y, blocks: [block] })
        }
        blocks.push(...rows.map(r => rowOf(r.blocks)))
    }
    // Panels no layout places, in the order the dashboard lists them: all of them when it has no layout
    const loose = Object.keys(panels).filter(key => !used.has(key))
    if (loose.length && layouts.length) problems.push(`${loose.length === 1 ? '1 panel is' : `${loose.length} panels are`} in no layout; drawn at the end`)
    blocks.push(...loose.map(key => blockOf(key, panels[key], ctx)))

    if (ctx.unknown.size) {
        const one = ctx.unknown.size === 1
        problems.push(`${[...ctx.unknown].map(n => `$${n}`).join(', ')}: ${one ? 'no value is' : 'no values are'} set, so ${one ? 'it matches' : 'they match'} everything in a label matcher and ${one ? 'stays' : 'stay'} as written elsewhere`)
    }
    if (!blocks.length) blocks.push({ type: 'text', color: 'subtle', text: 'This dashboard has no panels.' })

    // What each variable is set to heads the page, as a dashboard's variable bar does; then Open in Dash0, given one
    const head = []
    if (vars.size) head.push({ type: 'tags', id: 'variables', tags: [...vars].map(([name, v]) => ({ label: name, value: v.shown })) })
    if (/^https?:\/\//.test(str(options.href))) head.push({ type: 'link', href: str(options.href) })

    const name = str(dashboard.metadata?.name) || str(spec.display?.name)
    const slug = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 45)
    const id = /^[A-Za-z0-9_-]{1,53}$/.test(str(options.id)) ? str(options.id) : `perses-${slug || 'dashboard'}`
    const range = RANGES.some(r => r.value === options.range) ? options.range : rangeOfDuration(spec.duration)
    const refreshMs = num(options.refreshMs) ?? msOf(spec.refreshInterval)
    return {
        spec: {
            id,
            title: str(options.title) || str(spec.display?.name) || name || 'Dashboard',
            range,
            ...(refreshMs ? { refreshMs } : {}),
            ...(options.server ? { server: str(options.server) } : {}),
            ...(options.dataset ? { dataset: str(options.dataset) } : {}),
            blocks: [...head, ...blocks],
        },
        // A panel placed twice says its problems once
        problems: [...new Set(problems)],
    }
}
