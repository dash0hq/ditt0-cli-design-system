import { Link } from './link.jsx'

export default { title: 'Components/Navigation/Link', component: Link }

export const Default = { args: { href: 'https://app.dash0.com/goto/metrics/query-builder?org=acme&dataset=default', label: 'Open in Dash0' } }

// The one link under a chart drawn from Dash0, to the same view in the Dash0 app
export const Cta = { args: { href: 'https://app.dash0.com/goto/metrics/query-builder?org=acme&dataset=default', label: 'Open in Dash0', variant: 'cta' } }
