import { Dash0Logo, Ditt0Logo } from './logo.jsx'

export default { title: 'Components/Brand/Logo', component: Dash0Logo }

export const Default = { args: {} }
export const Mark = { args: { wordmark: false } }
// Ditt0 at rest; the gallery's header animates it
export const Ditt0 = { render: () => Ditt0Logo({ id: 'ditt0-story' }) }

// Two lines tall, for the top of a sidebar
export const Small = { args: { size: 'small' } }
