import { el } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'
import { Button } from '../../atoms/button/button.jsx'
import { Link } from '../../atoms/link/link.jsx'

// The kinds of nothing a view can show, each with its glyph and colour (content guidelines, EMPTY-* and ERROR-004):
//   first-time: nothing sent yet (EMPTY-001 pattern A): no title, a body of what the view shows and what can be
//               done with it (EMPTY-002), the CTA Send telemetry to Dash0, and links
//   no-results: data exists, but none matches the filter or query; the action clears or widens it
//   done:       nothing left to do (EMPTY-006): said briefly and positively, with what's next
//   error:      the data didn't load (ERROR-004): not a first-time state, so an error with a way to recover
const KINDS = {
    'first-time': { icon: '◇', color: () => status('cta').inline, cta: true },
    'no-results': { icon: '∅', color: () => undefined },
    done: { icon: '✓', color: () => status('healthy').inline },
    error: { icon: '✖', color: () => status('error').inline },
}

// What a view shows when it has nothing to show, centred where the content would be.
// variant: one of KINDS; title: the headline (none for first-time); body: full sentences, ending in a period
// (EMPTY-005), adding to the title, not repeating it (EMPTY-007).
// action: { label, onClick, id }, a CTA Button for first-time and an outline Button otherwise; links: [{ label, href }]
export function EmptyState({ variant = 'no-results', title, body, action, links = [] }) {
    const ui = el()
    const kind = KINDS[variant] ?? KINDS['no-results']
    return (
        <ui.Box flexDirection="column" alignItems="center" paddingY={1} gap={1}>
            <ui.Text color={kind.color()} dimColor={kind.color() ? undefined : true}>{kind.icon}</ui.Text>
            {title || body ? (
                <ui.Box flexDirection="column" alignItems="center">
                    {title ? <ui.Text bold>{title}</ui.Text> : null}
                    {body ? <ui.Text dimColor wrap="wrap">{body}</ui.Text> : null}
                </ui.Box>
            ) : null}
            {action ? <Button label={action.label} id={action.id} onClick={action.onClick} variant={kind.cta ? 'cta' : 'default'} /> : null}
            {links.length ? <ui.Box flexDirection="row" columnGap={3}>{links.map(l => <Link label={l.label} href={l.href} />)}</ui.Box> : null}
        </ui.Box>
    )
}
