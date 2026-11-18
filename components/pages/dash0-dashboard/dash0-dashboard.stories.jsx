import { Dash0Dashboard } from './dash0-dashboard.jsx'
import { parsePromql } from '../../../connectors/dash0/promql.js'
import { parseServiceCatalog, parseFailedChecks } from '../../../connectors/dash0/catalog.js'
import {
    OVERVIEW_REQUESTS, OVERVIEW_ERRORS, OVERVIEW_P95, OVERVIEW_BY_SERVICE, OVERVIEW_BY_STATUS,
    SERVICE_CATALOG, FAILED_CHECKS, OVERVIEW_AT,
} from '../../../fixtures/dash0-overview.js'

// Every panel as the Dash0 MCP answered it, 2026-10-19 (fixtures/dash0-overview.js)
const data = {
    requests: parsePromql(OVERVIEW_REQUESTS),
    errors: parsePromql(OVERVIEW_ERRORS),
    p95: parsePromql(OVERVIEW_P95),
    byService: parsePromql(OVERVIEW_BY_SERVICE),
    byStatus: parsePromql(OVERVIEW_BY_STATUS),
    services: parseServiceCatalog(SERVICE_CATALOG),
    checks: parseFailedChecks(FAILED_CHECKS),
}

export default {
    title: 'Features/Dash0/Pages/Services Overview',
    component: Dash0Dashboard,
    actions: ['onRangeChange', 'onAutoChange'],
    argsOnAction: { onRangeChange: (range) => ({ range }), onAutoChange: (auto) => ({ auto }) },
}

export const Default = { args: { data, range: '1h', at: OVERVIEW_AT, auto: true } }

// Opened, before Dash0 answered
export const Loading = { args: { data: {}, range: '1h', at: null, auto: true } }

// Auto-refresh off: the page says which moment it shows
export const Snapshot = { args: { data, range: '1h', at: OVERVIEW_AT, auto: false } }

// A refresh where two queries failed: those panels keep what they had, and the line says so
export const RefreshFailed = { args: { data, range: '1h', at: OVERVIEW_AT, auto: true, failed: ['byService', 'checks'] } }

// A panel that never loaded: its place says so, and the rest draw
export const PanelFailed = { args: { data: { ...data, checks: null }, range: '1h', at: OVERVIEW_AT, auto: true, failed: ['checks'] } }

// Nothing failing
export const AllPassing = { args: { data: { ...data, checks: { checks: [], link: data.checks.link } }, range: '1h', at: OVERVIEW_AT, auto: true } }
