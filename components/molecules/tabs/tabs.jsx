import { el, scoped } from '../../elements.js'
import { Button } from '../../atoms/button/button.jsx'

// A row of tabs, one open at a time. tabs: [{ value, label }]; value: the open tab's.
// Dash0's Tabs are parts (TabsList, TabsTrigger, TabsContent); a mod's JSX draws children before their
// parent sees them, so here the tabs come as one list and the caller draws the open tab's content
// variant: 'text', the open tab bright and the others dim, for tabs over a view's content; or 'buttons', each in a
// rounded border, the open one's in the accent colour, for a row of toggles that change what a view shows (a range)
export function Tabs({ tabs, value, onChange, gap = 3, variant = 'text' }) {
    const ui = el()
    return (
        // Tabs that don't fit the width go on to the next line, never past the edge
        <ui.Box flexDirection="row" flexWrap="wrap" columnGap={gap}>
            {variant === 'buttons' ? tabs.map(tab => (
                <Button
                    id={`tab-${tab.value}`}
                    label={tab.label}
                    selected={tab.value === value}
                    onClick={() => onChange?.(tab.value)}
                />
            )) : tabs.map(tab => (
                <ui.Button
                    key={scoped(`tab-${tab.value}`)}
                    label={tab.label}
                    plain
                    dimColor={tab.value !== value}
                    onPress={() => onChange?.(tab.value)}
                />
            ))}
        </ui.Box>
    )
}
