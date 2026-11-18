import { Services } from './services.jsx'
import { services, SERVICES_LINK } from '../../../fixtures/dash0-services.js'

export default { title: 'Components/Status/Services', component: Services }

// The busiest services in acme over an hour, fixtures/dash0-services.js, with Dash0's own health
export const Default = { args: { services, href: SERVICES_LINK } }

// The same services without Dash0's health: each worked out from its error rate, degraded from 0.05%, critical from 0.1%
export const FromErrorRate = {
    args: { services: services.map(({ health, ...s }) => s), errorThresholds: { degraded: 0.05, critical: 0.1 }, title: 'Services by error rate' },
}
