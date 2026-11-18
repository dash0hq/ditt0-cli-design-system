import { test, expect } from 'claude-code/testing'

import { parseServiceCatalog, parseFailedChecks } from './catalog.js'
import { SERVICE_CATALOG, FAILED_CHECKS } from '../../fixtures/dash0-overview.js'

test('the service catalog reads into services, busiest first, with Dash0\'s health and the link', () => {
    const read = parseServiceCatalog([{ type: 'text', text: SERVICE_CATALOG }])!
    expect(read.services.length).toBe(12)
    expect(read.services[0]).toEqual({ name: 'price-engine', namespace: 'dash0', requests: 31919847, errors: 0, p95: 0.0074, health: 'healthy' })
    expect(read.services[1]).toMatchObject({ name: 'api', errors: 0.0039, p95: 0.1672, health: 'critical' })
    // A service without a namespace has none, not ''
    expect(read.services.find(s => s.name === 'queue-bridge')!.namespace).toBe(null)
    expect(read.link).toMatch(/^https:\/\/app\.dash0\.com\/goto\/services\/catalog\?/)
})

test('external dependencies are left out of the services', () => {
    const external = '|    12 | DATABASE | external | | 1 | postgres | | 0.0100 | 0.0000 % | 5000.0000 | healthy |'
    const lines = SERVICE_CATALOG.split('\n')
    const end = lines.findIndex((l, i) => i > 0 && !l.startsWith('|'))
    const text = [...lines.slice(0, end), external, ...lines.slice(end)].join('\n')
    expect(parseServiceCatalog(text)!.services.map(s => s.name)).not.toContain('postgres')
})

test('an answer that isn\'t the catalog reads as null', () => {
    expect(parseServiceCatalog('Request failed: timeout')).toBe(null)
    expect(parseServiceCatalog('| a | b |\n| - | - |\n| 1 | 2 |')).toBe(null)
})

test('failed checks keep the ones still failing, each service once, and never read the Labels table', () => {
    const read = parseFailedChecks(FAILED_CHECKS)!
    // 30 rows: 26 critical or degraded, 4 resolved in the hour
    expect(read.checks.length).toBe(26)
    expect(read.checks.every(c => c.status === 'critical' || c.status === 'degraded')).toBe(true)
    expect(read.checks.filter(c => c.status === 'degraded').length).toBe(5)
    const crm = read.checks.find(c => c.summary === 'CRM API Requests Failing')!
    expect(crm).toEqual({ status: 'critical', summary: 'CRM API Requests Failing', rule: 'sales - crm - CRM API Calls Failing', since: '2026-10-19T10:03:17.002503721Z', services: ['ad-sync'] })
    // Dash0 lists price-engine twice on one check
    expect(read.checks.find(c => c.services.includes('price-engine'))!.services).toEqual(['price-engine'])
    expect(read.link).toMatch(/^https:\/\/app\.dash0\.com\/goto\/alerting\/failed-checks\?/)
})

test('no failed checks reads as none only when the answer says so', () => {
    expect(parseFailedChecks('No failed checks found.')).toEqual({ checks: [], link: null })
    expect(parseFailedChecks('Query timed out.')).toBe(null)
})
