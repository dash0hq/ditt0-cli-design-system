import { el } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'

// Text that opens a page: in the terminal the URL the terminal opens, on desktop and mobile the browser.
// A surface that can't open it draws the label plain
// variant: 'default', the label as the surface draws a link; or 'cta', the one link a view exists to offer, such
// as opening a chart's query in Dash0: Dash0's CTA purple fill, its ink on it, and ↗, Lucide's
// external-link, after the label to say it leaves Claude Code, in a CTA Button's frame (three rows), so it lines up
// with the buttons beside it. The label stays the link's name
export function Link({ href, label, variant = 'default' }) {
    const ui = el()
    if (variant !== 'cta') return <ui.Link href={href} label={label} />
    const { bg, text } = status('cta')
    return (
        <ui.Box borderStyle="round" borderColor={bg} backgroundColor={bg} paddingX={1}>
            <ui.Link href={href} label={label}>
                <ui.Text backgroundColor={bg} color={text} bold>{`${label ?? href} ↗`}</ui.Text>
            </ui.Link>
        </ui.Box>
    )
}
