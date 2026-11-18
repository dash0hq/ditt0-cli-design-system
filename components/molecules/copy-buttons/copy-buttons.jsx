import { el } from '../../elements.js'
import { copy, plainText } from '../../copy.js'
import { Button } from '../../atoms/button/button.jsx'

// Two quiet buttons under a table, chart or diagram that put it on the clipboard: Copy markdown, for a doc, a PR or
// an issue (a table as a GitHub table, a chart's data as one, a diagram as its Mermaid source), and Copy text, the
// drawing as it stands in the terminal, without its colours. A toast says Copied, or why not.
// markdown, text: what each copies; a button is left out when its text is. id: what the buttons' keys start with,
// so two of them on one page don't share a key
export function CopyButtons({ markdown, text, id = 'copy' }) {
    const ui = el()
    return (
        <ui.Box flexDirection="row" columnGap={2}>
            {markdown ? <Button variant="transparent" label="Copy markdown" id={`${id}-markdown`} onClick={() => copy(markdown)} /> : null}
            {text ? <Button variant="transparent" label="Copy text" id={`${id}-text`} onClick={() => copy(plainText(text))} /> : null}
        </ui.Box>
    )
}
