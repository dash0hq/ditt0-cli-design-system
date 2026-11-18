// Perses dashboards for the Perses tests and stories (connectors/perses.js), written for Ditt0 against the Perses spec
// (perses.dev) and Dash0's dialect of it. Each one carries
// the shapes real dashboards do, so the tests cover them: upstream and Dash0 kinds, the envelope Dash0 stores a
// dashboard in, panels of several queries, every kind of variable, YAML, and what doesn't draw in a terminal

const prom = (query, seriesNameFormat, extra = {}) => ({
    kind: 'TimeSeriesQuery',
    spec: { plugin: { kind: 'PrometheusTimeSeriesQuery', spec: { datasource: { kind: 'PrometheusDatasource', name: 'prometheus' }, query, ...(seriesNameFormat ? { seriesNameFormat } : {}), ...extra } } },
})
const panel = (name, kind, spec, queries = [], description) => ({
    kind: 'Panel',
    spec: { display: { name, ...(description ? { description } : {}) }, plugin: { kind, spec }, queries },
})
const item = (key, x, y, width = 12, height = 8) => ({ x, y, width, height, content: { $ref: `#/spec/panels/${key}` } })
const grid = (title, items) => ({ kind: 'Grid', spec: { ...(title ? { display: { title } } : {}), items } })

// Upstream Perses, as the Perses operator ships a node dashboard: four titled grids, a label-values variable used in
// = matchers, panels of two queries with series names, a gauge with named threshold colours, a stat, bytes per second
export const NODE_EXPORTER = {
    kind: 'PersesDashboard',
    metadata: { name: 'node-exporter-nodes', project: 'perses-dev' },
    spec: {
        display: { name: 'Node Exporter / Nodes' },
        duration: '1h',
        refreshInterval: '30s',
        variables: [{
            kind: 'ListVariable',
            spec: {
                name: 'instance', allowAllValue: true, allowMultiple: false, display: { name: 'Instance' },
                plugin: { kind: 'PrometheusLabelValuesVariable', spec: { labelName: 'instance', matchers: ['node_uname_info{job="node"}'] } },
            },
        }],
        panels: {
            cpu: panel('CPU usage', 'TimeSeriesChart', { legend: { position: 'bottom', mode: 'table', values: ['last'] }, yAxis: { format: { unit: 'percent-decimal' } } }, [
                prom('1 - sum without (mode) (rate(node_cpu_seconds_total{instance="$instance",job="node",mode=~"idle|iowait|steal"}[$__rate_interval]))', '{{cpu}} - busy'),
            ], 'CPU busy, by core'),
            load: panel('Load average', 'TimeSeriesChart', { yAxis: { format: { unit: 'decimal' } } }, [
                prom('node_load1{instance="$instance",job="node"}', '1m'),
                prom('node_load5{instance="$instance",job="node"}', '5m'),
                prom('node_load15{instance="$instance",job="node"}', '15m'),
            ]),
            memory: panel('Memory usage', 'TimeSeriesChart', { yAxis: { format: { unit: 'bytes' } }, visual: { stack: 'all', areaOpacity: 0.5 } }, [
                prom('node_memory_MemTotal_bytes{instance="$instance",job="node"} - node_memory_MemAvailable_bytes{instance="$instance",job="node"}', 'used'),
                prom('node_memory_Cached_bytes{instance="$instance",job="node"}', 'cached'),
            ]),
            memoryGauge: panel('Memory used', 'GaugeChart', { calculation: 'last', format: { unit: 'percent' }, thresholds: { defaultColor: 'green', mode: 'absolute', steps: [{ color: 'orange', value: 80 }, { color: 'red', value: 90 }] } }, [
                prom('100 - 100 * avg(node_memory_MemAvailable_bytes{instance="$instance",job="node"}) / avg(node_memory_MemTotal_bytes{instance="$instance",job="node"})', 'used'),
            ]),
            disk: panel('Disk I/O', 'TimeSeriesChart', { yAxis: { format: { unit: 'bytes/sec' } } }, [
                prom('rate(node_disk_read_bytes_total{instance="$instance",job="node",device!=""}[$__rate_interval])', '{{device}} read'),
                prom('rate(node_disk_written_bytes_total{instance="$instance",job="node",device!=""}[$__rate_interval])', '{{device}} written'),
            ]),
            uptime: panel('Uptime', 'StatChart', { calculation: 'last-number', format: { unit: 'seconds' } }, [
                prom('time() - node_boot_time_seconds{instance="$instance",job="node"}'),
            ]),
            network: panel('Network received', 'TimeSeriesChart', { yAxis: { format: { unit: 'bytes/sec' } }, visual: { display: 'bar' } }, [
                prom('rate(node_network_receive_bytes_total{instance="$instance",job="node",device!="lo"}[$__rate_interval])', '{{device}}'),
            ]),
            errors: panel('Network errors', 'TimeSeriesChart', {}, [
                prom('rate(node_network_receive_errs_total{instance="$instance",job="node",device!="lo"}[$__rate_interval])', '{{device}} receive'),
                prom('rate(node_network_transmit_errs_total{instance="$instance",job="node",device!="lo"}[$__rate_interval])', '{{device}} transmit'),
            ]),
        },
        layouts: [
            grid('CPU', [item('cpu', 0, 0), item('load', 12, 0)]),
            grid('Memory', [item('memory', 0, 0, 18), item('memoryGauge', 18, 0, 6)]),
            grid('Disk', [item('disk', 0, 0, 18), item('uptime', 18, 0, 6)]),
            grid('Network', [item('network', 0, 0), item('errors', 12, 0)]),
        ],
    },
}

// As Dash0 stores and answers a dashboard: { dashboard, report }, kind PersesDashboard, dash0Extensions, a Dash0
// filter variable, a multi-select list with a default used in =~, a text variable, Dash0's span metrics (which a
// Dash0 dataset has, so this one draws live), a Markdown note, a Dash0-only table, a Dash0 structured query, and a
// grid that starts collapsed
export const DASH0_STORED = {
    dashboard: {
        kind: 'PersesDashboard',
        metadata: { name: 'checkout-health', createdAt: '2026-10-20T08:00:00Z', version: 3, project: 'default', dash0Extensions: { tags: ['checkout'] } },
        spec: {
            display: { name: 'Checkout health', description: 'RED metrics for the checkout path' },
            duration: '6h',
            variables: [
                { kind: 'Dash0FilterVariable', spec: { name: 'filters', attributeKey: 'service.name' } },
                { kind: 'ListVariable', spec: { name: 'service', allowMultiple: true, allowAllValue: true, defaultValue: ['checkout', 'frontend'], plugin: { kind: 'PrometheusLabelValuesVariable', spec: { labelName: 'service_name', matchers: ['{otel_metric_name="dash0.spans"}'] } } } },
                { kind: 'TextVariable', spec: { name: 'kind', value: 'SERVER', constant: true } },
            ],
            panels: {
                about: panel('', 'Markdown', { text: '## Checkout\n\nRequests, errors and latency for **checkout** and the services it calls. Owned by the payments team.' }),
                requests: panel('Requests', 'TimeSeriesChart', { yAxis: { format: { unit: 'requests/sec' } }, legend: { showLegend: true, position: 'right' }, dash0Extensions: { yAxis: { scale: 'linear' }, maxTimeSeries: 50 } }, [
                    prom('sum by (service_name) (rate({otel_metric_name="dash0.spans", otel_span_kind="$kind", service_name=~"$service"}[$__rate_interval]))', '{{service_name}}'),
                ]),
                errorRate: panel('Error rate', 'StatChart', { calculation: 'mean', format: { unit: 'percent' }, thresholds: { mode: 'absolute', steps: [{ value: 1, color: '#f5a623' }, { value: 5, color: '#e0245e' }] }, sparkline: {} }, [
                    prom('100 * sum(rate({otel_metric_name="dash0.spans", otel_span_kind="$kind", otel_span_status_code="ERROR", service_name=~"$service"}[$__rate_interval])) / sum(rate({otel_metric_name="dash0.spans", otel_span_kind="$kind", service_name=~"$service"}[$__rate_interval]))'),
                ]),
                p95: panel('p95 latency', 'StatChart', { calculation: 'last', format: { unit: 'seconds' } }, [
                    prom('histogram_quantile(0.95, sum by (le) (rate({otel_metric_name="dash0.spans.duration", otel_span_kind="$kind", service_name=~"$service"}[$__rate_interval])))'),
                ]),
                byStatus: panel('Spans by status', 'PieChart', { calculation: 'sum', visual: { palette: { mode: 'categorical' } }, sort: { sortField: 'value', sortDirection: 'desc' } }, [
                    prom('sum by (otel_span_status_code) (increase({otel_metric_name="dash0.spans", service_name=~"$service"}[$__rate_interval]))', '{{otel_span_status_code}}'),
                ]),
                topServices: panel('Busiest services', 'TimeSeriesTable', { calculation: 'mean' }, [
                    prom('sum by (service_name) (rate({otel_metric_name="dash0.spans", otel_span_kind="$kind"}[$__rate_interval]))', '{{service_name}}'),
                ]),
                slowSpans: panel('Slowest spans', 'SpanTable', { dash0Extensions: { hideHeader: false } }),
                throughput: panel('Throughput by operation', 'TimeSeriesChart', {}, [{
                    kind: 'TimeSeriesQuery',
                    spec: { plugin: { kind: 'SpansTimeSeriesQuery', spec: { query: { queryType: 'range', range: '5m', metric: 'spans_rate', groupBy: ['dash0.operation.name'], filter: [], variables: [{ type: 'Dash0FilterVariableSelection', name: 'filters' }] } } } },
                }]),
            },
            layouts: [
                grid('Overview', [item('about', 0, 0, 24, 3), item('errorRate', 0, 3, 12, 4), item('p95', 12, 3, 12, 4), item('requests', 0, 7, 24)]),
                { kind: 'Grid', spec: { display: { title: 'Breakdown', collapse: { open: false } }, items: [item('byStatus', 0, 0), item('topServices', 12, 0), item('slowSpans', 0, 8), item('throughput', 12, 8)] } },
            ],
        },
    },
    report: [],
}

// Upstream Perses with everything a converter trips on: fields Dash0 drops (logBase, percent stacking, a pie's
// radius), kinds no terminal draws, a static list with labels, ${var:format} and [[var]], Perses' built-ins, units
// that convert (ns, minutes) or don't scale (currency), thresholds in percent with and without a max, a hidden
// query, a panel with no plugin, one with no query, a dangling $ref, a panel placed twice, a key a JSON pointer
// escapes, a layout that isn't a Grid, and a panel no layout places
export const UPSTREAM_EDGES = {
    kind: 'Dashboard',
    metadata: { name: 'Edge cases: upstream!', project: 'tests' },
    spec: {
        display: { name: 'Edge cases' },
        duration: '30m',
        variables: [
            { kind: 'ListVariable', spec: { name: 'env', allowMultiple: true, plugin: { kind: 'StaticListVariable', spec: { values: [{ value: 'prod', label: 'Production' }, { value: 'stage', label: 'Staging' }] } } } },
            { kind: 'ListVariable', spec: { name: 'job', defaultValue: 'api', plugin: { kind: 'PrometheusPromQLVariable', spec: { expr: 'up', labelName: 'job' } } } },
            { kind: 'ListVariable', spec: { name: 'pod', plugin: { kind: 'PrometheusLabelNamesVariable', spec: {} } } },
            { kind: 'DatasourceVariable', spec: { name: 'ds' } },
        ],
        panels: {
            latency: panel('Latency', 'TimeSeriesChart', { yAxis: { show: true, logBase: 10, format: { unit: 'nanoseconds' } }, visual: { stack: 'percent', lineStyle: 'dashed' } }, [
                prom('histogram_quantile(0.99, sum by (le) (rate(http_request_duration_ns_bucket{env=~"${env:regex}", job="[[job]]"}[$__rate_interval])))', 'p99'),
                prom('avg(http_request_duration_ns{job="$job"})', 'avg', { hidden: true }),
            ]),
            queueAge: panel('Queue age', 'StatChart', { calculation: 'max', format: { unit: 'minutes' }, metricLabel: 'queue', colorMode: 'background_solid', mappings: [], thresholds: { mode: 'percent', steps: [{ value: 50, color: 'yellow' }] } }, [
                prom('max(queue_age_minutes{env=~"$env"})'),
            ]),
            spend: panel('Spend', 'GaugeChart', { calculation: 'sum', format: { unit: 'currency-usd' }, max: 1000, thresholds: { mode: 'percent', steps: [{ value: 75, color: 'rgb(255, 152, 48)' }, { value: 90, color: 'rgb(242, 73, 92)' }] } }, [
                prom('sum(increase(cloud_cost_dollars_total[$__range]))'),
            ]),
            temp: panel('Temperature', 'GaugeChart', { calculation: 'last', format: { unit: 'celsius' } }, [prom('avg(node_hwmon_temp_celsius{job="$job"})')]),
            share: panel('Requests by code', 'PieChart', { calculation: 'last', mode: 'value', radius: 0.8, showLabels: true, colorPalette: ['#abc'], legend: { position: 'right' } }, [
                prom('sum by (code) (rate(http_requests_total{job="$job", pod=~"$pod"}[5m]))', 'HTTP {{code}}'),
            ]),
            top: panel('Top routes', 'BarChart', { calculation: 'mean', format: { unit: 'requests/sec' }, sort: 'desc', mode: 'value' }, [
                prom('topk(5, sum by (route) (rate(http_requests_total{job="$job"}[$__interval])))', '{{route}}'),
            ]),
            heat: panel('Latency heatmap', 'HeatMapChart', {}, [prom('sum by (le) (rate(http_request_duration_ns_bucket[5m]))')]),
            logs: panel('Logs', 'LogsTable', {}, [{ kind: 'LogQuery', spec: { plugin: { kind: 'LokiLogQuery', spec: { query: '{job="api"}' } } } }]),
            table: panel('Routes', 'Table', { columnSettings: [] }, [prom('sum by (route) (rate(http_requests_total{job="$job"}[5m]))', '{{route}}')]),
            bare: { kind: 'Panel', spec: { display: { name: 'No plugin' }, queries: [prom('up{job="$job"}')] } },
            empty: panel('Empty', 'TimeSeriesChart', {}, []),
            ingest: panel('Ingest window', 'StatChart', { calculation: 'last', format: { unit: 'milliseconds' } }, [prom('sum(ingest_lag_ms) / $__interval_ms * $__range_s')]),
            'a/b': panel('Escaped key', 'TimeSeriesChart', {}, [prom('up{env="$undefinedVar"}')]),
            loose: panel('Not placed', 'Markdown', { text: 'Placed by no layout.' }),
        },
        layouts: [
            grid('', [item('latency', 12, 0), item('queueAge', 0, 0), item('ghost', 0, 8), item('latency', 0, 16), item('a~1b', 12, 16)]),
            grid('Usage', [item('spend', 0, 0, 8), item('temp', 8, 0, 8), item('share', 16, 0, 8), item('top', 0, 8), item('heat', 12, 8), item('logs', 0, 16), item('table', 12, 16), item('bare', 0, 24), item('empty', 12, 24), item('ingest', 0, 32)]),
            { kind: 'Tabs', spec: { items: [] } },
        ],
    },
}

// Dash0 YAML, as its API and getDashboard answer: a multi-select variable with no default, used in =~; panels with
// queries but no plugin; no layouts, so every panel draws in the order listed
export const DASH0_YAML = `kind: Dashboard
metadata:
  name: spans-by-service
spec:
  display:
    name: Spans by service
  duration: 15m
  variables:
    - kind: ListVariable
      spec:
        name: service
        allowMultiple: true
        plugin:
          kind: PrometheusLabelValuesVariable
          spec:
            labelName: service_name
            matchers: ['{otel_metric_name="dash0.spans"}']
  panels:
    throughput:
      spec:
        display:
          name: Throughput
        queries:
          - kind: TimeSeriesQuery
            spec:
              plugin:
                kind: PrometheusTimeSeriesQuery
                spec:
                  query: 'sum by (service_name) (rate({otel_metric_name="dash0.spans", service_name=~"$service"}[$__rate_interval]))'
                  seriesNameFormat: '{{service_name}}'
    errors:
      spec:
        display:
          name: Errors
        queries:
          - kind: TimeSeriesQuery
            spec:
              plugin:
                kind: PrometheusTimeSeriesQuery
                spec:
                  query: 'sum(rate({otel_metric_name="dash0.spans", otel_span_status_code="ERROR", service_name="$service"}[$__rate_interval]))'
`

// The same dashboard as JSON text, as percli and Dash0's export write one
export const DASH0_JSON_TEXT = JSON.stringify(NODE_EXPORTER, null, 2)

// A dashboard as big as the largest ones in use: 30 grids of 4 panels, each of 2 queries, for the converter's pace
export const bigDashboard = (grids = 30, perGrid = 4) => {
    const panels = {}
    const layouts = []
    for (let g = 0; g < grids; g++) {
        const items = []
        for (let p = 0; p < perGrid; p++) {
            const key = `g${g}_p${p}`
            panels[key] = panel(`Panel ${g}.${p}`, p % 4 === 3 ? 'StatChart' : 'TimeSeriesChart', { yAxis: { format: { unit: 'percent-decimal' } }, calculation: 'last' }, [
                prom(`rate(metric_${g}_${p}_total{instance="$instance"}[$__rate_interval])`, '{{instance}} a'),
                prom(`rate(metric_${g}_${p}_errors{instance="$instance"}[$__rate_interval])`, '{{instance}} b'),
            ])
            items.push(item(key, (p % 2) * 12, Math.floor(p / 2) * 8))
        }
        layouts.push(grid(`Section ${g}`, items))
    }
    return { kind: 'Dashboard', metadata: { name: 'big' }, spec: { display: { name: 'Big' }, variables: [{ kind: 'ListVariable', spec: { name: 'instance', plugin: { kind: 'PrometheusLabelValuesVariable', spec: { labelName: 'instance' } } } }], panels, layouts } }
}

// Sample answers in the shape of the Dash0 MCP's promql tool (org acme, dataset default), 2026-10-23,
// to queries the dashboards above make once their variables are put in, $__rate_interval as 5m

// sum by (otel_span_status_code) (increase({otel_metric_name="dash0.spans", service_name=~".*"}[5m])), 07:37–08:02 UTC
export const PERSES_BY_STATUS = `# Series Attribute Sets
| Series ID | otel_span_status_code |
| :-------- | :-------------------- |
| #1        | UNSET                 |
| #2        | OK                    |
| #3        | ERROR                 |

# Query Results per Series ID
| Timestamp                | #1          | #2         | #3       |
| :----------------------- | :---------- | :--------- | :------- |
| 2026-10-23T07:37:40.000Z | 321223.0000 | 9638.0000  | 428.0000 |
| 2026-10-23T07:42:40.000Z | 337810.0000 | 10263.0000 | 86.0000  |
| 2026-10-23T07:47:40.000Z | 363854.0000 | 7102.0000  | 219.0000 |
| 2026-10-23T07:52:40.000Z | 368042.0000 | 24594.0000 | 243.0000 |
| 2026-10-23T07:57:40.000Z | 420708.0000 | 17441.0000 | 261.0000 |
| 2026-10-23T08:02:40.000Z | 335120.0000 | 15751.0000 | 127.0000 |


[Open metric query builder in Dash0](https://app.dash0.com/goto/metrics/query-builder?org=acme&dataset=default)
`

// The p95 of services that served nothing in the window, service_name=~"(checkout|frontend)": one series, every
// sample blank
export const PERSES_ALL_GAPS = `# Series Attribute Sets
| Series ID |
| :-------- |
| #1        |

# Query Results per Series ID
| Timestamp                | #1 |
| :----------------------- | :- |
| 2026-10-23T07:37:40.000Z |    |
| 2026-10-23T07:42:40.000Z |    |
| 2026-10-23T07:47:40.000Z |    |
| 2026-10-23T07:52:40.000Z |    |
| 2026-10-23T07:57:40.000Z |    |
| 2026-10-23T08:02:40.000Z |    |


[Open metric query builder in Dash0](https://app.dash0.com/goto/metrics/query-builder?org=acme&dataset=default)
`

// A node-exporter metric this dataset doesn't have, count by (job) (node_cpu_seconds_total): no series at all
export const PERSES_NO_RESULTS = `# Series Attribute Sets
| Series ID |
| :-------- |

# Query Results per Series ID
| Timestamp |
| :-------- |

No results returned. Common causes:
* The metric name must be the VALUE of the \`otel_metric_name\` label with its dots preserved (\`{otel_metric_name="dash0.spans"}\`), not a bare or underscored selector like \`dash0_spans\`. Dots-to-underscores applies to label keys (attribute keys) only, never to the metric name.
* The metric may not exist in this time range or dataset — use getMetricCatalog to verify the name and type


[Open metric query builder in Dash0](https://app.dash0.com/goto/metrics/query-builder?org=acme&dataset=default)
`
