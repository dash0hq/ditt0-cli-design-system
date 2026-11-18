import { Text } from './text.jsx'

export default { title: 'Foundations/Text', component: Text }

export const Default = { args: { children: 'api answered 1,128 requests per second' } }
export const Subtle = { args: { color: 'subtle', children: 'last 30 minutes, UTC' } }
export const Intense = { args: { color: 'intense', children: 'order-history-api' } }
export const ErrorColor = { args: { color: 'error', children: 'Check rule failed: p99 latency above 500 ms' } }
export const Mono = { args: { mono: true, children: 'histogram_quantile(0.99, ...)' } }
