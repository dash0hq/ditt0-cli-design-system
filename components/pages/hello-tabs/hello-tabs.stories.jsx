import { HelloTabs } from './hello-tabs.jsx'

export default { title: 'Features/Hello Tabs/Pages/Hello Tabs', component: HelloTabs, actions: ['onTabChange', 'onCount'] }

export const Default = { args: { tab: 'one' } }
export const Counter = { args: { tab: 'two', count: 3 } }
export const Latency = { args: { tab: 'three' } }
