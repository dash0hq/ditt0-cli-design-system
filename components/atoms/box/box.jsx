import { el } from '../../elements.js'

// A flex container: rows and columns of other components, with space between and around them.
// gap and padding count terminal cells, or name a step: 'xs', 'sm', 'md', 'lg', 'xl'
export function Box({ direction = 'column', gap = 0, padding = 0, border = false, children }) {
    const ui = el()
    return (
        <ui.Box
            flexDirection={direction}
            gap={gap}
            padding={padding}
            borderStyle={border ? 'round' : undefined}
            borderDimColor={border || undefined}
        >
            {children}
        </ui.Box>
    )
}
