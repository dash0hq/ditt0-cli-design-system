// A sample answer in the shape of the Dash0 MCP's getFailedChecks tool (org acme, dataset default; made-up checks), 2026-10-19 10:15–13:15 UTC:
// the checks still failing at 13:15. status: Dash0's, critical or degraded; summary: the check's own text;
// rule: the check rule's name; since: when it started failing; services: the services it names, if any
export const FAILED_CHECKS_LINK = 'https://app.dash0.com/goto/alerting/failed-checks?org=acme&dataset=default&from=now-3h&to=now'

// When the answer was taken: a check's duration runs from since to here
export const checkedAt = '2026-10-19T13:15:00Z'

export const failedChecks = [
    { status: 'critical', summary: 'Coupon rule(s) fail to compile for example-tenant-name-7 and may affect their discounts', rule: 'checkout - coupons - coupon rule compilation failure', since: '2026-10-19T13:08:05Z', services: [] },
    { status: 'critical', summary: 'Fraud-detector rate limits exceeded in acme-store-eu-central-1-cluster1', rule: 'platform - fraud-detector - fraud-detector rate limit exceeded', since: '2026-10-19T12:27:15Z', services: ['fraud-detector'] },
    { status: 'critical', summary: 'Increased log error percentage (6.916%) for shop service api (acme-store-eu-central-1-cluster1)', rule: 'platform - errors (2m) - increased log error percentage - shop-*', since: '2026-10-19T12:22:29Z', services: ['api'] },
    { status: 'critical', summary: 'Refund cost for <no value> in acme-store-eu-west-1-cluster1 is increasing.', rule: 'payments - Refund cost is increasing', since: '2026-10-19T11:51:22Z', services: [] },
    { status: 'degraded', summary: 'Card pay in acme-store-eu-west-1-cluster1 hourly refund is above the threshold and over 3x the same hour last week, or new', rule: '[Team Pay] Refunds per channel - Refund cost is increasing', since: '2026-10-19T10:15:08Z', services: [] },
    { status: 'critical', summary: 'CRM API Requests Failing', rule: 'sales - crm - CRM API Calls Failing', since: '2026-10-19T10:03:17Z', services: ['ad-sync'] },
    { status: 'critical', summary: "Expression for CheckRule 'metrics - price-engine - price-engine routed to a channel that does not exist' is failing!", rule: 'metrics - price-engine - price-engine routed to a channel that does not exist', since: '2026-10-19T09:35:46Z', services: ['price-engine'] },
    { status: 'critical', summary: 'Refund cost for <no value> in acme-store-eu-central-1-cluster1 is increasing.', rule: 'payments - Refund cost is increasing', since: '2026-10-19T05:51:22Z', services: [] },
    { status: 'critical', summary: 'Card authentication failures increasing in acme-store-us-west-2-cluster1', rule: 'payments - Card authentication failures are increasing', since: '2026-10-10T09:11:41Z', services: ['search'] },
]
