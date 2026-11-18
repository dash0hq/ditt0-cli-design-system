import { Badge } from './badge.jsx'

export default { title: 'Components/Feedback/Badge', component: Badge }

export const Default = { args: { label: 'Beta' } }
export const Critical = { args: { label: 'Critical', color: 'critical' } }
export const Attention = { args: { label: 'Degraded', color: 'attention' } }
export const Success = { args: { label: 'Passing', color: 'success' } }
export const Severe = { args: { label: '3 errors', color: 'severe' } }
export const Primary = { args: { label: 'New', color: 'primary' } }
export const Subtle = { args: { label: 'Critical', color: 'critical', subtle: true } }
