// A sample answer in the shape of the Dash0 MCP's getServiceCatalog tool (org acme, dataset default; made-up services), 2026-10-19 12:15–13:15 UTC:
// the 14 busiest services in the dash0 namespace, external dependencies left out, sorted by requests.
// requests: the hour's total; errors: the percentage of requests that failed; p95: duration in seconds;
// health: Dash0's own verdict, critical while a failed check names the service
export const SERVICES_LINK = 'https://app.dash0.com/goto/services/catalog?org=acme&dataset=default&from=now-1h&to=now'

export const services = [
    { name: 'price-engine', requests: 34657409, errors: 0, p95: 0.0078, health: 'healthy' },
    { name: 'api', requests: 3005410, errors: 0.0035, p95: 0.2716, health: 'critical' },
    { name: 'carts', requests: 868326, errors: 0.0157, p95: 0.3879, health: 'healthy' },
    { name: 'inventory', requests: 496768, errors: 0.0002, p95: 0.0542, health: 'healthy' },
    { name: 'order-history-api', requests: 307805, errors: 0.0025, p95: 0.2284, health: 'healthy' },
    { name: 'search', requests: 296769, errors: 0.0014, p95: 239.5896, health: 'healthy' },
    { name: 'fulfillment-queue-worker', requests: 234197, errors: 0.0004, p95: 1.5139, health: 'healthy' },
    { name: 'gcp-warehouse-sync-tasks-worker', requests: 159523, errors: 0.0050, p95: 0.7304, health: 'healthy' },
    { name: 'ui', requests: 139810, errors: 0, p95: 0.0033, health: 'healthy' },
    { name: 'checkout', requests: 65040, errors: 0.0810, p95: 0.9150, health: 'healthy' },
    { name: 'email-notifications', requests: 53666, errors: 0.1391, p95: 0.2131, health: 'healthy' },
    { name: 'recommendation-task-worker', requests: 40501, errors: 0, p95: 0.6978, health: 'healthy' },
    { name: 'currencies', requests: 30657, errors: 0, p95: 0.6759, health: 'healthy' },
    { name: 'aws-warehouse-sync-tasks-worker', requests: 11640, errors: 0.0103, p95: 1.4918, health: 'healthy' },
]
