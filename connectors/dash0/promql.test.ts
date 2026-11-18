import { test, expect } from 'claude-code/testing'

import { clockTime } from './promql.js'
import { PROMQL_ONE_SERIES as ONE_SERIES, PROMQL_BY_SERVICE as BY_SERVICE, PROMQL_BY_SPAN_STATUS as BY_SPAN_STATUS } from '../../fixtures/promql.js'

const result = (tool: string, text: string, isErrored = false) => ({
    component: 'ToolResult',
    requestId: 't1',
    props: { tool_use_id: 't1', tool, output: [{ type: 'text', text }], isErrored },
}) as const

// Stands in for Claude Code's own drawing of a result the mod passes on
const engine = (on: any) => on('ui.render', async ($: any, e: any) => $.ui.resolve(e).Text({ children: ['engine drawing'] }))

for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    test(`a claude.ai Dash0 promql result draws as a chart on ${surface}`, async ($, on) => {
        engine(on)
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...result('mcp__claude_ai_Dash0__promql', ONE_SERIES) } as any)
        expect(await ui.find({ type: 'Text', text: /[─╭╮╰╯\u2801-\u28ff]/ } as any)).toBeDefined()
        // The first sample, 07:35 UTC, on the person's own clock
        expect(await ui.find({ type: 'Text', text: new RegExp(clockTime(Date.parse('2026-10-19T07:35:05.000Z'))) } as any)).toBeDefined()
        expect(await ui.find({ text: /engine drawing/ } as any)).toBeUndefined()
        await ui.unmount()
    })

    test(`a local Dash0 server's result names each series by its labels on ${surface}`, async ($, on) => {
        engine(on)
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...result('mcp__dash0-prod__promql', BY_SERVICE) } as any)
        expect(await ui.find({ type: 'Text', text: /fulfillment-queue-worker/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /no data/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a series' labels reach the color manager, so ERROR draws red, on ${surface}`, async ($, on) => {
        engine(on)
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...result('mcp__dash0-prod__promql', BY_SPAN_STATUS) } as any)
        expect(await ui.find({ type: 'Text', text: '━' } as any)).toMatchObject({ props: { color: '#e33238' } })
        await ui.unmount()
    })

    test(`an errored Dash0 result is drawn by Claude Code on ${surface}`, async ($, on) => {
        engine(on)
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...result('mcp__claude_ai_Dash0__promql', 'query failed', true) } as any)
        expect(await ui.find({ text: /engine drawing/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a Dash0 answer in another shape is drawn by Claude Code on ${surface}`, async ($, on) => {
        engine(on)
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...result('mcp__claude_ai_Dash0__promql', 'No series matched the query.') } as any)
        expect(await ui.find({ text: /engine drawing/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a folded group keeps its line and draws the chart under it on ${surface}`, async ($, on) => {
        engine(on)
        const call = { tool_use_id: 't1', tool: 'mcp__claude_ai_Dash0__promql', input: {}, isRunning: false, isErrored: false, isInterrupted: false, output: [{ type: 'text', text: BY_SERVICE }] }
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, component: 'ToolGroup', requestId: 'g1', props: { calls: [call], isActive: false, isExpanded: false } } as any)
        expect(await ui.find({ text: /engine drawing/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /order-history-api/ } as any)).toBeDefined()
        await ui.unmount()
    })

    test(`a group still running draws only its line on ${surface}`, async ($, on) => {
        engine(on)
        const call = { tool_use_id: 't1', tool: 'mcp__claude_ai_Dash0__promql', input: {}, isRunning: true, isErrored: false, isInterrupted: false }
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, component: 'ToolGroup', requestId: 'g1', props: { calls: [call], isActive: true, isExpanded: false } } as any)
        expect(await ui.find({ text: /engine drawing/ } as any)).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /[─╭╮╰╯\u2801-\u28ff]/ } as any)).toBeUndefined()
        await ui.unmount()
    })

    test(`another tool's result is left alone on ${surface}`, async ($, on) => {
        engine(on)
        const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', surface, ...result('mcp__claude_ai_Dash0__getSpans', ONE_SERIES) } as any)
        expect(await ui.find({ text: /engine drawing/ } as any)).toBeDefined()
        await ui.unmount()
    })
}
