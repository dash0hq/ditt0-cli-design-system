import { ColorReuse, ColorMeaning } from './color-reuse.jsx'

export default { title: 'Foundations/Colors/Color Manager', component: ColorReuse }

export const Default = { args: {} }

// Attribute sets Dash0 series carry, worst meaning first
export const Meaning = {
    render: (args) => ColorMeaning(args),
    args: {
        examples: [
            { otel_span_status_code: 'ERROR' },
            { http_response_status_code: '503' },
            { 'error.type': 'TimeoutError' },
            { otel_log_severity_range: 'WARN' },
            { http_response_status_code: '404' },
            { otel_log_severity_range: 'INFO' },
            { otel_span_status_code: 'OK' },
            { http_response_status_code: '200' },
            { http_response_status_code: '201' },
            { otel_span_status_code: 'UNSET' },
            { service_name: 'api' },
        ],
    },
}
