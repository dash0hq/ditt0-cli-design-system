import { el, surface, scoped } from '../../elements.js'

// One value picked from a list, the engine's Select: a dataset, a service, a sort order.
// For two to five options a person compares at a glance, a row of ChartControls toggles or Tabs shows them all;
// a Select fits a longer list, or one that changes.
// id: its address; label: what it picks, always shown (FIELD-001); options: [{ value, label }], values unique;
// value: the picked one's; onValueChange(value): runs with the one picked, and the page keeps it.
// The mobile app draws no Select yet, so there every option is a press, keyed <id>-<value>, the picked one bright
export function Select({ id, label, options, value, onValueChange, autoFocus }) {
    const ui = el()
    if (surface() === 'mobile') return (
        <ui.Box flexDirection="column">
            <ui.Text dimColor>{label}</ui.Text>
            <ui.Box flexDirection="row" flexWrap="wrap" columnGap={2}>
                {options.map(o => (
                    <ui.Button key={scoped(`${id}-${o.value}`)} label={o.label ?? o.value} plain dimColor={o.value !== value} onPress={() => onValueChange?.(o.value)} />
                ))}
            </ui.Box>
        </ui.Box>
    )
    return (
        <ui.Select
            key={scoped(id)}
            label={label}
            options={options.map(o => ({ value: o.value, label: o.label ?? o.value }))}
            value={value}
            autoFocus={autoFocus}
            onSelect={(picked) => onValueChange?.(picked)}
        />
    )
}
