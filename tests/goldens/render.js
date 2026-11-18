import { el, setElements, surface } from '../../components/elements.js'
import { keyFor, setWidth } from '../../components/measure.js'
import { Timeseries } from '../../components/molecules/charts/timeseries/timeseries.js'
import { Stat, sparkline } from '../../components/molecules/charts/stat/stat.jsx'
import { ChartControls } from '../../components/molecules/chart-controls/chart-controls.jsx'
import { Button } from '../../components/atoms/button/button.jsx'
import { CASES } from './cases.js'
import { paint, plainText } from './paint.js'

// Each golden case drawn by the JS components, as Claude Code's terminal lays them out (paint.js): its plain text,
// and its styles, a line per row. The Go package's test draws the same cases (cases.json) and must match both

// Elements as plain objects: { type, props, children }, children flattened, numbers written as text
const flat = (children) => [children].flat(Infinity).filter(c => c !== null && c !== undefined && c !== false && c !== true).map(c => typeof c === 'number' ? String(c) : c)
const element = (type) => ({ children, ...props } = {}) => ({ type, props, children: flat(children) })
const ELEMENTS = Object.fromEntries(['Box', 'Text', 'Button', 'Client'].map(t => [t, element(t)]))

// JSX in the components: h calls a component (the element factories too) with its props and children
const h = (type, props, ...children) => type({ ...(props ?? {}), children: flat(children) })
const Fragment = ({ children }) => ELEMENTS.Box({ flexDirection: 'column', children })

// The widest a drawing is when not told its width (an unmeasured chart)
const WIDE = 200

const tree = (c) => {
    if (c.kind === 'timeseries') {
        if (c.width) setWidth(keyFor('timeseries', c.props.series.map(s => s.name).join(',')), c.width)
        return Timeseries({ ...c.props, controls: false })
    }
    if (c.kind === 'stat') return Stat(c.props)
    if (c.kind === 'sparkline') return ELEMENTS.Text({ children: [sparkline(c.props.values, c.props.width)] })
    if (c.kind === 'controls') return ChartControls(c.props)
    // A Button as it sits in a row of them, as wide as its label
    if (c.kind === 'button') return ELEMENTS.Box({ flexDirection: 'row', children: [Button(c.props)] })
    throw new Error(`goldens: no kind ${c.kind}`)
}

// A row's runs as the golden's style line: each run its width in cells, then what styles it (fg, bg, b for bold,
// d for dim), - for none: "6:d 1:fg#828aff,b"
const styleLine = (runs) => runs.map(r => `${[...r.text].length}:${[r.fg && `fg${r.fg}`, r.bg && `bg${r.bg}`, r.bold && 'b', r.dim && 'd'].filter(Boolean).join(',') || '-'}`).join(' ')

// Every case: { name, text, style }, drawn in the dark theme
export const renderGoldens = () => {
    const outer = el()
    const outerSurface = surface()
    const outerH = globalThis.h
    const outerFragment = globalThis.Fragment
    setElements(ELEMENTS, 'terminal')
    globalThis.h = h
    globalThis.Fragment = Fragment
    try {
        return CASES.map(c => {
            const rows = paint(tree(c), c.width || WIDE)
            return { name: c.name, text: plainText(rows) + '\n', style: rows.map(styleLine).join('\n') + '\n' }
        })
    } finally {
        setElements(outer, outerSurface)
        globalThis.h = outerH
        globalThis.Fragment = outerFragment
    }
}

export { CASES }
