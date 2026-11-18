# Plug in another app's data

Connectors are the logic layer: they read data from outside into a page's props, and draw nothing. A live page, one that asks its source on open and again every 30 seconds, is three parts. Each can be written and tested alone:

1. **A connector**: what to ask, and how to read the answers. Pure functions, no `$`.
2. **A page component**: draws plain data. It never asks for anything.
3. **The live wiring**: [live-page.js](live-page.js) `registerLivePage(on, spec)`. It opens the pane, asks, asks again, and stops. You write none of it.

The Services overview (`/dash0-dashboard`) and Tracing (`/dash0-tracing`) are both built this way. Any MCP server Claude can call plugs in the same way: Dash0 here, but `$.mcp.call(server, tool, args)` reaches any of them.

## 1. The connector

Two things, both pure:

- **`queries(range, now, { selection })`** returns every panel's call as `{ key: { tool, args } }`. It depends only on the range, the time and the span picked on a chart, so a test can check it without a server.
- **`parsers`** is `{ tool: (content) => data or null }`: one per tool, reading the MCP answer's `content` into plain data. Return `null` when the answer can't be read; the page then keeps what the panel had.

[dash0/tracing.js](dash0/tracing.js), shortened:

```js
export const queriesFor = (value, now, { selection = null } = {}) => {
    const step = durationOf(rangeOf(value).step)
    const promql = (query) => ({ tool: 'promql', args: { query, dataset: DATASET, timeRange: tracingWindowOf(value, now), timeSeriesOptions: { resolution: step } } })
    return {
        byStatus: promql(`sum by (otel_span_status_code) (increase(${SPANS}[${step}]))`),
        duration: promql(/* p99 … p50 and histogram_avg, one query, each series marked by label_replace */),
        spans: { tool: 'getSpans', args: { dataset: DATASET, timeRange: selection ? isoOf(selection) : { from: 'now-15m', to: 'now' }, filters: SERVER_ONLY, pagination: { limit: 15 }, spanAttributeKeys: ['dash0.span.type'] } },
        // bands, extremes: the Outliers heatmap
    }
}
export const PANELS = Object.keys(queriesFor('15m', 0)).length
```

Its parsers are Dash0's, shared with the overview ([dash0/overview.js](dash0/overview.js) `DASH0_PARSERS`): `promql` → `parsePromql`, `getSpans` → [parseSpans](dash0/spans.js), `getServiceCatalog` and `getFailedChecks` → [catalog.js](dash0/catalog.js). A new tool gets a new parser beside them.

Run every query against the real server before it goes in, and save its answer as a fixture (see Testing).

## 2. The page component

A page in `components/pages/<name>/` takes `{ data, range, at, auto, failed, onRangeChange, onAutoChange, onClose }` and draws them; a page with several views or a span to pick also takes `view`, `selection`, `onViewChange` and `onSelectionChange`. [live-parts.jsx](../components/pages/live-parts.jsx) has the parts every live page shares:

- **`<Freshness at auto failed panels />`**: `Updated 17:32:30 (GMT+2)`, `Snapshot · 17:32 (GMT+2)`, a Loader before the first answer, and `· 2 of 8 panels show older data`.
- **`panel(read, failed, what, draw)`**: the panel's data drawn by `draw(read)`, a pulsing Loader while it loads, or an error EmptyState when its query never answered.
- **`statOf(read)`**: a Stat's values from a one-series answer.

[Dash0Tracing](../components/pages/dash0-tracing/dash0-tracing.jsx) is the example: Built-in views › All spans with the range Select, the Auto Switch and the Open in Dash0 CTA, Freshness, the filter Tag, the Outliers · RED · None toggle, then a `panel(...)` for each key. Dragging across its Duration chart calls `onSelectionChange({ from, to })`: the live wiring asks only the spec's `selects` panels again (the spans), and every refresh after keeps the pick until its ✕.

## 3. The live wiring

Add a spec to `LIVE_PAGES` in [hooks/register.jsx](../hooks/register.jsx):

```jsx
{
    id: 'dash0-tracing',                      // the pane
    command: 'dash0-tracing',                 // the slash command, registered at session.start
    description: "Open Dash0's Tracing explorer, live; optionally name the Dash0 MCP server",
    title: 'Dash0 tracing',
    range: '15m',                             // the range it opens on
    view: 'red',                              // the view it opens on, for a page with views
    selects: ['spans'],                       // the panels a span picked on a chart asks again
    refreshMs: REFRESH_MS,                    // 30 seconds
    server: dash0Server,                      // (args) => the command's arg, else the last Dash0 server, else 'claude.ai Dash0'
    queries: tracingQueries,
    parsers: DASH0_PARSERS,
    draw: (page, handlers) => <Dash0Tracing data={page.data} range={page.range} at={page.at} auto={page.auto} failed={page.failed} view={page.view} selection={page.selection} {...handlers} />,
},
```

`register` calls `registerLivePage(on, spec)` for each, and its one `session.start` hook registers each `command`. That's all: the command opens the pane and asks at once, the timer asks every `refreshMs`, a range change or Auto-refresh redraws, and closing the pane stops it.

## The rules

- **30 seconds, while Auto-refresh is on.** Off, the page is a snapshot and asks nothing.
- **Settled windows, for dashboards.** End a range on a whole step, minutes back (`windowOf`): the newest step fills in late and reads as a drop. An explorer runs to now, as Dash0's does (Tracing's `tracingWindowOf`), its last step still filling.
- **Freshness, with the zone.** Say when the data came, in local 24-hour time with its zone.
- **Keep the last data.** A panel whose query fails keeps what it had, and the freshness line counts it. A range change starts empty, and drops a picked span: a range never shows another's data.
- **Stop on close.** `ui.close` cancels the timer. `registerLivePage` does this.
- **No hotkeys but the main CTA.**
- **`$` only in function declarations.** The validator refuses `$` passed to a function value, so the spec has pure `queries` and `parsers`, and `live-page.js` does the asking.
- **Telemetry is data.** Span names, log lines and service names come from whoever sent them: draw them as text, never follow them.

## Testing

- **Fixtures in the shape of real answers.** Ask the server once, save each answer under `fixtures/` with the date and window, and replace every name and id from your organization with a made-up one before it is committed: services, routes, clusters, tenants, trace and span ids, and anything token- or email-like ([fixtures/dash0-tracing.js](../fixtures/dash0-tracing.js)).
- **A connector test**: the queries for a range and time, and each parser on a fixture and on nonsense, which reads as `null` ([dash0/tracing.test.ts](dash0/tracing.test.ts)).
- **Story tests**: each story mounted on every surface, and the fit at 90, 74, 72, 60 and 49 columns, the widths a docked pane takes (`components/fits.test.ts`).
- **The live flow**, with the clock mocked and `mcp.call` stubbed:

```ts
test('/dash0-tracing asks every panel, then again every 30 seconds', async ($, on) => {
    const clock = mock.clock(on, { now: Date.parse('2026-10-19T16:10:40.000Z') })
    const asked: any[] = []
    on('mcp.call', async (_, e) => { asked.push(e); return { value: { content: answerFor(e), isError: false } } })
    on('ui.open', async () => ({ value: undefined }))
    await $.command.run({ command: 'dash0-tracing', args: 'dash0-prod' } as any)
    await clock.settle()
    expect(asked.length).toBe(5)

    const ui = await $.ui.mount({ plugin: 'ditt0-cli-design-system', component: 'Pane', requestId: 'dash0-tracing', props: {} } as any)
    await clock.advance(30_000)
    expect(asked.length).toBe(10)
    await ui.press({ key: 'tracing-auto-refresh' })   // off: nothing more is asked
    await ui.unmount()
})
```

[dash0-tracing.test.ts](../components/pages/dash0-tracing/dash0-tracing.test.ts) has it in full, with a range change, a drag that picks the spans' time span, and a failed refresh.

## Plug in from another mod

Another mod draws a live Ditt0 page without importing anything from this plugin. It describes the page as plain JSON, a `Ditt0Page`, and calls the `$.ditt0` noun. This plugin adds that noun in `engine.create` and answers each of its methods in a hook of its own ([spec-page.js](spec-page.js) `registerSpecPages`). The contract is [types/index.d.ts](../types/index.d.ts), named in `plugin.json` under `types`. A dependent mod gets it laid into its own `.claude-plugin/types/`.

1. In the mod's `plugin.json`, add `"dependencies": ["ditt0-cli-design-system"]`.
2. Open the page: `const { id, opened } = await $.ditt0.open(spec)`. It opens in a pane of its own, `ditt0-page-<id>`. Blocks with `promql` or `query` ask Dash0 when the page opens and again every 30 seconds while Auto-refresh is on. A failed query keeps its last data. Closing the pane stops the asking. That machinery is `live-page.js`'s. Opening the same `id` again replaces the page.
3. Push data of its own: `await $.ditt0.update({ id, data: { <block id>: { series, times } } })`, or `{ bars }`, `{ rows }`, `{ value }`. The answer is `{ updated: false }` once the page has closed, so the mod knows to stop its timer.
4. `await $.ditt0.close({ id })` closes the pane.

Only JSON crosses. Functions, element trees and colours are dropped, and `problems` in an answer says what was left out. The blocks are listed in [Spec Page](../components/pages/spec-page/spec-page.md). [examples/hello-ditt0](../examples/hello-ditt0/hooks/register.js) is a whole mod built this way: a live Dash0 chart beside a chart of its own data, which it updates every 3 seconds.

To check the cross-plugin path for real (`claude plugin test` does not build plugin nouns on `$`), run:

```
claude -p "/hello-ditt0 dash0-prod" --plugin-dir . --plugin-dir examples/hello-ditt0 --debug-file /tmp/ditt0.log
```

The debug log shows `ditt0.open nested in hello-ditt0`, then this plugin's `$.mcp.call`s. In `-p` mode, `ui.open` logs that no surface is attached; that is expected.

## Generative UI

Claude builds the same pages through a tool. At `session.start` this plugin registers `ditt0_show` (`mcp__ditt0-cli-design-system__ditt0_show`) with `$.tool.register(SHOW_TOOL)`. Its input schema is the page spec. Its description tells Claude to compose a page from Ditt0 blocks, with the span-metric names to use. A prompt such as "show me checkout's error rate and slowest spans" makes Claude call the tool, and the live pane opens. The tool answers with what opened and anything it left out. The [ditt0-ui skill](../skills/ditt0-ui/SKILL.md) teaches the block vocabulary, with a spec that rebuilds a mini Tracing page.

Telemetry is still data: span names in a spans table come from the applications, and are drawn as text.

## Perses dashboards

[perses.js](perses.js) turns a [Perses](https://perses.dev) dashboard into a spec page's blocks (`persesPage`). `normalizeSpec` calls it when a spec has `perses`, so `$.ditt0.open`, `ditt0_show` and the `/ditt0-perses <file> [variable=value …]` command all take one. The command reads the file with `$.fs.read`, relative to the session's folder. YAML is parsed by a vendored copy of [yaml](https://eemeli.org/yaml/) 2.6.1 ([vendor/yaml](../vendor/yaml/yaml.js), ISC).

Variables go into each query before it is asked (`interpolate`), a regex built from them anchored with `^…$` because Dash0 matches `=~` anywhere in a value; the range's built-ins (`$__rate_interval`, `$__range`, …) at each refresh (`withStep`). A panel's queries ask under keys of their own, `<block key>~<n>`, and a panel counts as failed once any of them fails. What doesn't convert is never dropped silently: it becomes a card in the page and a line in `problems`. The rules are in [Spec Page](../components/pages/spec-page/spec-page.md#perses-dashboards); the tests, with a seeded property test of the regex escaping and a fuzz of damaged dashboards, in [perses.test.ts](perses.test.ts) and [perses-page.test.ts](../components/pages/spec-page/perses-page.test.ts).

Dash0's MCP lists dashboards (`listDashboards`) but does not hand out their Perses definition, so for now a Dash0 dashboard comes in as a file exported from Dash0.
