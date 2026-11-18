import { FailedChecks } from './failed-checks.jsx'
import { failedChecks, checkedAt, FAILED_CHECKS_LINK } from '../../../fixtures/dash0-failed-checks.js'

export default { title: 'Components/Status/FailedChecks', component: FailedChecks }

// The checks failing in acme at 13:15 UTC on 2026-10-19, fixtures/dash0-failed-checks.js
export const Default = { args: { checks: failedChecks, now: checkedAt, href: FAILED_CHECKS_LINK } }

export const AllPassing = { args: { checks: [], now: checkedAt, href: FAILED_CHECKS_LINK } }
