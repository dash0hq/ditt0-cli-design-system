import { Heading } from './heading.jsx'

export default { title: 'Components/Typography/Heading', component: Heading }

export const Default = { args: { children: 'Services' } }
// The three pixel sizes, largest first
export const H1 = { args: { children: 'Services', level: 'h1' } }
export const H2 = { args: { children: 'Services', level: 'h2' } }
export const H3 = { args: { children: 'Services', level: 'h3' } }
export const Section = { args: { children: 'Failed checks', level: 'heading' } }
// Two words too wide for one line: the second goes under the first
export const Long = { args: { children: 'Services Overview' } }
export const Colored = { args: { children: 'Ditt0', color: '#e15ff4', level: 'h2' } }
