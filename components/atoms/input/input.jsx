import { el, surface, scoped } from '../../elements.js'
import { status } from '../../foundations/tokens/tokens.js'

// A field a person types into, the engine's Input with Dash0's field rules (content guidelines, FIELD-*):
// a label always shows (FIELD-001); a placeholder only shows a format, such as d4e5f6a7-… (FIELD-002);
// optional adds (optional) to the label and required adds *, one or the other on a form (FIELD-003);
// error is drawn under the field in the error colour, and says what to enter (FIELD-004, ERROR-003).
// id: the field's address. onChange(value): each change as it is typed; onSubmit(value): Enter, or the submit
// button when submitLabel names one. rows: more than 1 for a field that takes several lines.
// The mobile app draws no field yet, so there the label and the value are shown, read only
export function Input({ id, label, placeholder, value, onChange, onSubmit, submitLabel, rows, optional = false, required = false, error, autoFocus }) {
    const ui = el()
    const shown = optional ? `${label} (optional)` : required ? `${label} *` : label
    return (
        <ui.Box flexDirection="column">
            {surface() === 'mobile' ? [
                <ui.Text dimColor>{shown}</ui.Text>,
                value ? <ui.Text>{value}</ui.Text> : <ui.Text dimColor>{placeholder ?? '—'}</ui.Text>,
            ] : <ui.Input
                key={scoped(id)}
                label={shown}
                placeholder={placeholder}
                value={value}
                submitLabel={submitLabel}
                rows={rows}
                autoFocus={autoFocus}
                onInput={(text) => onChange?.(text)}
                onSubmit={(text) => onSubmit?.(text)}
            />}
            {error ? <ui.Text color={status('error').inline}>{error}</ui.Text> : null}
        </ui.Box>
    )
}
