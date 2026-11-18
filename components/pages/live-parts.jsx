import { el } from '../elements.js'
import { Loader } from '../atoms/loader/loader.jsx'
import { EmptyState } from '../molecules/empty-state/empty-state.jsx'
import { clockTime, zoneOf } from '../../connectors/dash0/promql.js'

// What every live page draws around its panels (connectors/live-page.js): how current it is, and each panel's
// loading and error states. The Services overview and Tracing pages share them

// How current the page is, in one line, with the zone (TIME-003): when the data came, or that it is still coming
// (a Loader); a refresh where some panels failed says how many still show their last data.
// panels: how many the page has
export const freshnessOf = ({ at, auto, failed, panels }) => {
    if (!at) return failed.length ? "Couldn't reach Dash0. Trying again in 30 seconds." : 'Loading from Dash0…'
    const time = `${clockTime(at, { seconds: true })} (${zoneOf(at)})`
    if (failed.length) return `Updated ${time} · ${failed.length} of ${panels} panels show older data`
    return auto ? `Updated ${time}` : `Snapshot · ${clockTime(at)} (${zoneOf(at)})`
}
// refreshing: a refresh is asking now; the line pulses while it does, so the page reads as live
export function Freshness(props) {
    const ui = el()
    const line = freshnessOf(props)
    if (!props.at && !props.failed.length) return <Loader label={line} />
    if (props.refreshing) return <Loader label={line} variant="pulse" id="freshness-refreshing" />
    return <ui.Text dimColor wrap="wrap">{line}</ui.Text>
}

// A panel's content: drawn from its data; while there is none, a pulsing Loader, or, when its query failed, an
// error that says the page tries again (ERROR-004). id: keys its Loader, for a page whose panels can share a name
export const panel = (read, failed, what, draw, id) => {
    if (read) return draw(read)
    if (failed) return <EmptyState variant="error" title={`Couldn't load ${what}`} body="Dash0 didn't answer. The page asks again on the next refresh." />
    return <Loader label={`Loading ${what}…`} variant="pulse" id={id} />
}

// The last value of a one-series answer, its series, and its first time, for a Stat
export const statOf = (read) => {
    const values = read?.series[0]?.values ?? []
    return { values, previous: values.find(v => v !== null), compareLabel: read ? `vs ${read.times[0]}` : '' }
}
