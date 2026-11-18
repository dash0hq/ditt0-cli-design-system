import { el } from '../../elements.js'
import { Text } from '../../atoms/text/text.jsx'
import { ChartControls } from '../../molecules/chart-controls/chart-controls.jsx'

export { RANGES, LINE_TYPES, ORIENTATIONS } from '../../molecules/chart-controls/chart-controls.jsx'

// A chart in a card: a dim rounded border around a title and subtitle, a line of controls (ChartControls: line
// type or orientation, time ranges, zoom), the chart, and any actions under it. The chart fills the card's width by
// itself (measure.js). The card only shows the controls and says which was pressed: the page keeps every value and
// queries again, as Tabs leaves the open tab to its caller.
// title: what the chart shows; subtitle: where from, such as the query or the time span
// ranges, range, onRangeChange, lineType, onLineTypeChange, orientation, onOrientationChange, zoom, onZoomReset,
// addZoomControl, onZoomIn, onZoomOut: ChartControls' props, passed on; the page passes lineType or orientation
// on to the chart inside too
// actions: elements under the chart, such as an Open in Dash0 Link; children: the chart
export function ChartCard({ title, subtitle, ranges, range, onRangeChange, lineType, onLineTypeChange, orientation, onOrientationChange, zoom, onZoomReset, addZoomControl = false, onZoomIn, onZoomOut, actions = [], children }) {
    const ui = el()
    return (
        <ui.Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1} gap={1}>
            <ui.Box flexDirection="column">
                <Text color="intense">{title}</Text>
                {/* Prose, such as a query: in a narrow pane it wraps onto a second line */}
                {subtitle ? <ui.Text dimColor wrap="wrap">{subtitle}</ui.Text> : null}
            </ui.Box>
            {/* The controls on a line of their own, so a zoom's span never pushes the title about */}
            <ChartControls
                lineType={lineType}
                onLineTypeChange={onLineTypeChange}
                orientation={orientation}
                onOrientationChange={onOrientationChange}
                ranges={ranges}
                range={range}
                onRangeChange={onRangeChange}
                zoom={zoom}
                onZoomReset={onZoomReset}
                addZoomControl={addZoomControl}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
            />
            {children}
            {actions.length ? <ui.Box flexDirection="row" columnGap={2}>{actions}</ui.Box> : null}
        </ui.Box>
    )
}
