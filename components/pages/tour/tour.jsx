import { el } from '../../elements.js'
import { Heading } from '../../atoms/heading/heading.jsx'
import { Text } from '../../atoms/text/text.jsx'
import { Badge } from '../../atoms/badge/badge.jsx'
import { Button } from '../../atoms/button/button.jsx'
import { Switch } from '../../atoms/switch/switch.jsx'
import { Tag } from '../../atoms/tag/tag.jsx'
import { Loader } from '../../atoms/loader/loader.jsx'
import { Dash0Logo } from '../../atoms/logo/logo.jsx'
import { Colors } from '../../foundations/tokens/colors.jsx'
import { Stat } from '../../molecules/charts/stat/stat.jsx'
import { ChartControls } from '../../molecules/chart-controls/chart-controls.jsx'
import { Timeseries } from '../../molecules/charts/timeseries/timeseries.js'
import { BarChart } from '../../molecules/charts/bar-chart/bar-chart.js'
import { PaneTemplate } from '../../templates/pane/pane.jsx'
import { times, apiLatency, requestRates } from '../../../fixtures/dash0.js'
import { spanTimes, spansByStatus } from '../../../fixtures/dash0-span-status.js'
import { memoryTimes, memoryByService } from '../../../fixtures/dash0-memory.js'

// A tour of the library that plays itself: /book-tour. Each step is a slide, or one state of a slide (a chart
// drawn as dots, then lines, then bars), shown for STEP_MS before the next; the person can step with Previous and
// Next. Every chart is drawn from sample Dash0 data (fixtures/), the way a page draws it

export const STEP_MS = 6000

const zoomed = (series, from, to) => series.map(s => ({ ...s, values: s.values.slice(from, to + 1) }))

// A chart with its controls showing the view it is in, so the switch is seen to move
const viewed = (lineType, chart, zoom) => {
    const ui = el()
    return (
        <ui.Box flexDirection="column" gap={1}>
            <ChartControls lineType={lineType} ranges={[]} zoom={zoom} addZoomControl hotkeys={false} />
            {chart}
        </ui.Box>
    )
}

const code = (source, language = 'js') => {
    const ui = el()
    return <ui.Box borderStyle="round" borderDimColor paddingX={1}><ui.Code language={language} source={source} /></ui.Box>
}

// Lines of a diagram, drawn dim but for the accent words
const diagram = (lines) => {
    const ui = el()
    return <ui.Box flexDirection="column">{lines.map(line => <ui.Text color={line.startsWith('▸') ? 'suggestion' : undefined}>{line}</ui.Text>)}</ui.Box>
}

const PLUG_IN = `// your mod's plugin.json:  "dependencies": ["ditt0-cli-design-system"]
await $.ditt0.open({
  id: 'checkout', title: 'Checkout', range: '1h',
  blocks: [
    { type: 'stats', items: [{ label: 'Error rate', unit: 'percent', goodWhen: 'down',
        promql: '100 * sum(rate(errors[$step])) / sum(rate(spans[$step]))' }] },
    { type: 'timeseries', title: 'Requests', unit: '/s',
      promql: 'sum(rate({otel_metric_name="dash0.spans", service_name="checkout"}[$step]))' },
    { type: 'timeseries', id: 'queue', title: 'Jobs', series: [...], times: [...] },
    { type: 'table', title: 'Slowest spans', spans: { sort: 'slowest' } },
  ],
})
await $.ditt0.update({ id: 'checkout', data: { queue: { series, times } } })  // your own data, live`

const GENERATIVE = `> show me api's error rate and its slowest spans

⏺ ditt0_show({ id: 'api-errors', title: 'Api errors', range: '1h', blocks: [
    { type: 'stats', items: [{ label: 'Error rate', promql: '…' }] },
    { type: 'timeseries', title: 'Errors', promql: '…' },
    { type: 'table', title: 'Slowest spans', spans: { sort: 'slowest' } } ] })
  ⎿  Opened a live page: Api errors

The model composes the page; Ditt0 draws it and keeps it current every 30 s`

// Every step of the tour: its title, what it says, and what it draws
export const STEPS = [
    {
        title: 'Ditt0',
        caption: "Dash0's design system, drawn in the Claude Code terminal",
        draw: () => {
            const ui = el()
            return (
                <ui.Box flexDirection="column" gap={1}>
                    <Dash0Logo />
                    <ui.Box flexDirection="row" columnGap={1}><Badge label="Live data" color="primary" /><Badge label="Dash0 MCP" /><Badge label="Claude Code mods" /></ui.Box>
                    <Text color="subtle">Components, charts and live pages, from Dash0's own tokens. Type /book for the docs.</Text>
                </ui.Box>
            )
        },
    },
    {
        title: 'One design system',
        caption: "Dash0's colour tokens, its type and its controls, for a terminal",
        draw: () => {
            const ui = el()
            return (
                <ui.Box flexDirection="column" gap={1}>
                    <Colors group="status" />
                    <ui.Box flexDirection="row" columnGap={2} flexWrap="wrap">
                        <Button id="tour-cta" label="Open in Dash0" variant="cta" />
                        <Button id="tour-default" label="Filter" />
                        <Button id="tour-delete" label="Delete" variant="destructive" />
                        <Switch id="tour-switch" label="Auto-refresh" checked />
                    </ui.Box>
                    <ui.Box flexDirection="row" columnGap={1} flexWrap="wrap">
                        <Badge label="Critical" color="critical" /><Badge label="Degraded" color="attention" /><Badge label="Healthy" color="success" />
                        <Tag id="tour-tag" label="service.name" value="checkout" />
                        <Loader id="tour-loader" label="Asking Dash0" variant="pulse" />
                    </ui.Box>
                </ui.Box>
            )
        },
    },
    {
        title: 'Charts: dots',
        caption: 'Braille dots: two dots a cell across, four down. The finest line a terminal draws',
        draw: () => viewed('braille', <Timeseries series={apiLatency} times={times} unit="ms" controls={false} lineType="braille" />),
    },
    {
        title: 'Charts: lines',
        caption: 'Box lines: the same data a row at a time, for a bold stroke',
        draw: () => viewed('box', <Timeseries series={apiLatency} times={times} unit="ms" controls={false} lineType="box" />),
    },
    {
        title: 'Charts: bars',
        caption: 'Bars: a bar a column from zero, in eighths of a row. Every chart switches, Dots / Lines / Bars',
        draw: () => viewed('bars', <Timeseries series={apiLatency.slice(0, 1)} times={times} unit="ms" controls={false} lineType="bars" />),
    },
    {
        title: 'Bars, grouped',
        caption: 'Several series as bars are grouped: a bar per service in each window, side by side to compare',
        draw: () => viewed('bars', <Timeseries series={memoryByService} times={memoryTimes} unit="bytes" controls={false} lineType="bars" />),
    },
    {
        title: 'Bars, stacked',
        caption: 'Series that add up, such as spans by status, stack: one bar a window, ERROR in red on OK',
        draw: () => viewed('bars', <Timeseries series={spansByStatus} times={spanTimes} controls={false} lineType="bars" stacked />),
    },
    {
        title: 'Small values still show',
        caption: 'p50, under 1 ms beside p99 at 400: too small to scale, drawn as the thinnest line, never as nothing',
        draw: () => (
            <BarChart
                labels={['00:00', '06:00', '12:00', '18:00']}
                series={[
                    { name: 'p50', values: [0.84, 0.9, 0.81, 0.86] },
                    { name: 'p95', values: [139, 166, 153, 136] },
                    { name: 'p99', values: [372, 510, 699, 360] },
                ]}
                unit="ms"
                alt="api latency p50, p95 and p99 by six hours"
            />
        ),
    },
    {
        title: 'Zoom',
        caption: '+ and − zoom around the middle, or press i and o; r resets. Drag across a chart to zoom to that span',
        draw: () => viewed('box', <Timeseries series={apiLatency} times={times} unit="ms" controls={false} />),
    },
    {
        title: 'Zoom: in',
        caption: 'i: half the span, the samples spread out',
        draw: () => viewed('box', <Timeseries series={zoomed(apiLatency, 12, 35)} times={times.slice(12, 36)} unit="ms" controls={false} />, `${times[12]}–${times[35]}`),
    },
    {
        title: 'Zoom: in again',
        caption: 'i again: every sample its own columns. r goes back to the whole range',
        draw: () => viewed('box', <Timeseries series={zoomed(apiLatency, 18, 29)} times={times.slice(18, 30)} unit="ms" controls={false} />, `${times[18]}–${times[29]}`),
    },
    {
        title: 'Small multiples',
        caption: 'Series far apart get a panel each, on one time axis, so a quiet one is never flattened by a loud one',
        draw: () => <Timeseries series={requestRates} times={times} unit="/s" controls={false} />,
    },
    {
        title: 'Stats',
        caption: 'The numbers a page leads with: the latest value, a sparkline, and how it compares',
        draw: () => {
            const ui = el()
            const api = requestRates[0].values.filter(v => v !== null)
            const p95 = apiLatency[1]?.values.filter(v => v !== null) ?? api
            return (
                <ui.Box flexDirection="row" columnGap={4} flexWrap="wrap">
                    <Stat label="Requests" values={api} unit="/s" previous={api[0]} compareLabel="vs 4h ago" />
                    <Stat label="p95 latency" values={p95} unit="ms" previous={p95[0]} compareLabel="vs 4h ago" goodWhen="down" />
                </ui.Box>
            )
        },
    },
    {
        title: 'Live pages',
        caption: '/dash0-tracing and /dash0-dashboard ask the Dash0 MCP every 30 seconds and draw what comes back',
        draw: () => diagram([
            '▸ Dash0 MCP   promql · getSpans · getServiceCatalog · getFailedChecks',
            '      │',
            '      ▼',
            '▸ connector   the queries, and a parser per tool: answers in, plain data out',
            '      │',
            '      ▼',
            '▸ live page   refresh every 30 s · keep a failed panel\'s last data · ranges · Close',
            '      │',
            '      ▼',
            '▸ page        Ditt0 components: RED charts, the spans table, stats, links to Dash0',
        ]),
    },
    {
        title: 'Plug in from any mod',
        caption: 'Another mod depends on Ditt0 and opens a live page with $.ditt0: plain data in, a Dash0 page out',
        draw: () => code(PLUG_IN),
    },
    {
        title: 'Generative UI',
        caption: 'Claude composes pages on the fly: the ditt0_show tool takes the same blocks, so any prompt can become a live page',
        draw: () => code(GENERATIVE, 'text'),
    },
    {
        title: 'The framework',
        caption: 'Atomic layers, each built from the one before; connectors and $.ditt0 feed the pages',
        draw: () => diagram([
            '▸ foundations  tokens · colour manager · units',
            '▸ atoms        Button · Badge · Switch · Tag · Heading · Loader · Logo',
            '▸ molecules    Timeseries · BarChart · Heatmap · Stat · Table · Tabs',
            '▸ organisms    ChartCard · Services · Failed checks · Series table',
            '▸ templates    Pane · Tool result',
            '▸ pages        Tracing · Services overview · any page a mod or Claude composes',
            '',
            '  skills/ditt0-ui teaches Claude the rules; every component has a doc and stories in /book',
        ]),
    },
    {
        title: 'A first',
        caption: 'We found no earlier design-system, live, MCP-fed dashboard inside Claude Code',
        draw: () => diagram([
            'Closest we found:',
            '▸ claude-charts   charts in a Claude Code pane, drawn once from data Claude hands over',
            '▸ slab-deck       a live pane with its own design language, for the session\'s own usage',
            '▸ MCP Apps        Datadog\'s and Elastic\'s observability UI, as HTML in chat clients',
            '',
            "Ditt0 puts Dash0's design system, live telemetry and generative pages in the terminal.",
        ]),
    },
]

// The tour at one step. step: an index into STEPS; onPrevious, onNext, onClose: the foot's buttons
export function Tour({ step = 0, onPrevious, onNext, onClose }) {
    const ui = el()
    const at = Math.max(0, Math.min(STEPS.length - 1, step))
    const slide = STEPS[at]
    return (
        <PaneTemplate
            body={
                <ui.Box flexDirection="column" gap={1}>
                    <Heading level="h2">{slide.title}</Heading>
                    <Text color="subtle">{slide.caption}</Text>
                    {slide.draw()}
                </ui.Box>
            }
            footer={`${at + 1} of ${STEPS.length}`}
            actions={[
                <Button id="tour-previous" label="Previous" onClick={onPrevious} />,
                <Button id="tour-next" label="Next" onClick={onNext} />,
                <Button id="tour-close" label="Close" onClick={onClose} />,
            ]}
        />
    )
}
