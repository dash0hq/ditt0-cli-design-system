import { ChartControls } from './chart-controls.jsx'

// Pressing a control sets the story's args, so the controls follow, as a page keeping them would
export default {
    title: 'Components/Charts/ChartControls',
    component: ChartControls,
    actions: ['onLineTypeChange', 'onOrientationChange', 'onRangeChange', 'onZoomReset', 'onZoomIn', 'onZoomOut'],
    argsOnAction: {
        onLineTypeChange: 'lineType',
        onOrientationChange: 'orientation',
        onRangeChange: (range) => ({ range, zoom: undefined }),
        onZoomReset: () => ({ zoom: undefined }),
    },
}

// A line chart's controls: Dots / Lines, the default ranges, and − and + at the far right
export const Default = { args: { lineType: 'braille', range: '24h', addZoomControl: true } }

// A line chart zoomed in: the span shown takes the ranges' place, with Reset zoom beside it
export const Zoomed = { args: { lineType: 'braille', range: '24h', zoom: '05:00–06:00', addZoomControl: true } }

// A bar chart's controls: Vertical / Horizontal and the ranges; no zoom, since bars have nothing between them
export const BarChart = { args: { orientation: 'vertical', range: '7d', ranges: [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
] } }

// Ranges of any length and label, such as an SLO's windows
export const CustomRanges = { args: { range: '28d', ranges: [
    { value: '15m', label: 'Last 15 min' },
    { value: '1d', label: 'Today' },
    { value: '28d', label: 'SLO window (28 days)' },
] } }
