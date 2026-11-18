import { test, expect, mock } from 'claude-code/testing'
import { mountStory, SURFACES } from '../../../tests/story.ts'
import { REFRESH_MS } from '../../../connectors/dash0/overview.js'
import { OVERVIEW_REQUESTS, OVERVIEW_BY_SERVICE, OVERVIEW_BY_STATUS, SERVICE_CATALOG, FAILED_CHECKS } from '../../../fixtures/dash0-overview.js'

const STORY = 'features-dash0-pages-services-overview'
const FRESH = /^Updated \d\d:\d\d:\d\d \((UTC|GMT[+-][\d:]+)\)$/

for (const surface of SURFACES) {
    test(`the overview draws its stats, both charts, the failing checks and the services on ${surface}`, async ($) => {
        const ui = await mountStory($, `${STORY}--default`, surface)
        expect(await ui.find({ type: 'Text', text: 'Requests' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'Error rate' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: 'P95 latency' } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /Requests by service/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /Spans by status/ } as any)).toBeDefined()
        // Series named by their labels, as the chart's legend shows them
        expect(await ui.find({ type: 'Text', text: /fulfillment-queue-worker/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /CRM API Requests Failing/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /email-notifications/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: FRESH } as any)).toBeDefined()
        const links: any[] = await ui.findAll({ type: 'Link' } as any)
        expect(links.length).toBe(5)
        expect(links.every(l => /^https:\/\/app\.dash0\.com\//.test(l.props.href))).toBe(true)
        await ui.unmount()
    })
}

test('the overview says which span it shows', async ($) => {
    const ui = await mountStory($, `${STORY}--default`, 'terminal')
    expect(await ui.find({ type: 'Text', text: /^Server spans · dataset default · \d\d:\d\d–\d\d:\d\d · 5m steps$/ } as any)).toBeDefined()
    await ui.unmount()
})

test('before Dash0 answers, every panel says it is loading', async ($) => {
    const ui = await mountStory($, `${STORY}--loading`, 'terminal')
    // A spinner for the page, a pulse in each of its 7 panels
    const loaders: any[] = await ui.findAll({ type: 'Client' } as any)
    expect(loaders.filter(c => c.props.props?.label === 'Loading from Dash0…')).toHaveLength(1)
    expect(loaders.filter(c => /^Loading .+…$/.test(c.props.props?.label ?? '') && c.props.props.frames.includes('■'))).toHaveLength(7)
    await ui.unmount()
})

test('a refresh that failed for some panels says how many kept their data', async ($) => {
    const ui = await mountStory($, `${STORY}--refresh-failed`, 'terminal')
    expect(await ui.find({ type: 'Text', text: /^Updated \d\d:\d\d:\d\d \((UTC|GMT[+-][\d:]+)\) · 2 of 7 panels show older data$/ } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /CRM API Requests Failing/ } as any)).toBeDefined()
    await ui.unmount()
})

test('a panel that never loaded says so, and the others draw', async ($) => {
    const ui = await mountStory($, `${STORY}--panel-failed`, 'terminal')
    expect(await ui.find({ type: 'Text', text: "Couldn't load failed checks" } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /email-notifications/ } as any)).toBeDefined()
    await ui.unmount()
})

test('with nothing failing, the checks say all pass', async ($) => {
    const ui = await mountStory($, `${STORY}--all-passing`, 'terminal')
    expect(await ui.find({ type: 'Text', text: /All checks passing/ } as any)).toBeDefined()
    await ui.unmount()
})

// What the server answers each panel
const answer = async (_: any, e: any) => {
    const text = e.tool === 'getServiceCatalog' ? SERVICE_CATALOG
        : e.tool === 'getFailedChecks' ? FAILED_CHECKS
        : /service_name\)/.test(e.args.query) ? OVERVIEW_BY_SERVICE
        : /status_code\)/.test(e.args.query) ? OVERVIEW_BY_STATUS
        : OVERVIEW_REQUESTS
    return { value: { content: [{ type: 'text', text }], isError: false } }
}

const PANE = { plugin: 'ditt0-cli-design-system', surface: 'terminal', component: 'Pane', requestId: 'dash0-dashboard', props: { title: 'Dash0 services overview', isFocused: true } }

test('/dash0-dashboard asks the server named for every panel, then again every 30 seconds until Auto-refresh is off', async ($, on) => {
    const clock = mock.clock(on, { now: Date.parse('2026-10-19T14:17:42.000Z') })
    const asked: any[] = []
    on('mcp.call', async (_: any, e: any) => { asked.push(e); return answer(_, e) })
    on('ui.open', async () => ({ value: undefined }))
    await $.command.run({ command: 'dash0-dashboard', args: 'dash0-prod' } as any)
    await clock.settle()
    expect(asked.length).toBe(7)
    expect(asked.every(e => e.server === 'dash0-prod')).toBe(true)

    const ui = await $.ui.mount(PANE as any)
    expect(await ui.find({ type: 'Text', text: FRESH } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /CRM API Requests Failing/ } as any)).toBeDefined()

    await clock.advance(REFRESH_MS)
    expect(asked.length).toBe(14)

    // Another range asks again at once, in its own step
    await ui.press({ key: 'tab-6h' })
    await clock.settle()
    expect(asked.length).toBe(21)
    expect(asked[asked.length - 1].args).toBeDefined()
    expect(asked.slice(-7).filter(e => e.tool === 'promql').every(e => e.args.timeSeriesOptions.resolution === '30m')).toBe(true)

    // Off, it stops asking
    await ui.press({ key: 'overview-auto-refresh' })
    await clock.advance(REFRESH_MS * 3)
    expect(asked.length).toBe(21)
    expect(await ui.find({ type: 'Text', text: /^Snapshot · \d\d:\d\d/ } as any)).toBeDefined()

    // On again, it asks at once. (Closing the pane stops it too, at ui.close, which the test kit can't raise)
    await ui.press({ key: 'overview-auto-refresh' })
    await clock.settle()
    expect(asked.length).toBe(28)
    await ui.press({ key: 'overview-auto-refresh' })
    await ui.unmount()
})
