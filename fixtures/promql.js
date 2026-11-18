// Sample answers in the shape of the Dash0 MCP's promql tool, 2026-10-19, shortened: the markdown it hands Claude
// The link as the tool writes it, without its from, to and query parameters
export const PROMQL_LINK = 'https://app.dash0.com/goto/metrics/query-builder?org=acme&dataset=default'
const HINT = '<dash0:deep-link-hint>The markdown link above points to the matching view in Dash0 — please surface it in your reply so the user can open it.</dash0:deep-link-hint>'

export const PROMQL_ONE_SERIES = `# Series Attribute Sets
| Series ID |
| :-------- |
| #1        |

# Query Results per Series ID
| Timestamp                | #1       |
| :----------------------- | :------- |
| 2026-10-19T07:35:05.000Z | 63.2211  |
| 2026-10-19T07:40:05.000Z | 66.2865  |
| 2026-10-19T07:45:05.000Z | 66.2204  |


[Open metric query builder in Dash0](${PROMQL_LINK})
${HINT}`

// Four services, each missing a sample somewhere
export const PROMQL_BY_SERVICE = `# Series Attribute Sets
| Series ID | service_name             |
| :-------- | :----------------------- |
| #1        | order-history-api        |
| #2        | thumbnail                |
| #3        | product_catalog_sync     |
| #4        | fulfillment-queue-worker |

# Query Results per Series ID
| Timestamp                | #1      | #2      | #3      | #4      |
| :----------------------- | :------ | :------ | :------ | :------ |
| 2026-10-19T07:50:10.000Z | 15.5671 | 24.1838 | 28.4294 |         |
| 2026-10-19T07:55:10.000Z |         | 30.8338 | 28.7168 | 14.8970 |
| 2026-10-19T08:00:10.000Z |         | 24.8033 | 29.9500 | 14.9865 |
| 2026-10-19T08:05:10.000Z | 9.5020  |         | 28.9825 | 13.8717 |


[Open metric query builder in Dash0](${PROMQL_LINK})
${HINT}`

// Spans on api by status, the first four samples: the label key otel_span_status_code carries meaning
export const PROMQL_BY_SPAN_STATUS = `# Series Attribute Sets
| Series ID | otel_span_status_code |
| :-------- | :-------------------- |
| #1        | ERROR                 |
| #2        | UNSET                 |
| #3        | OK                    |

# Query Results per Series ID
| Timestamp                | #1       | #2           | #3        |
| :----------------------- | :------- | :----------- | :-------- |
| 2026-10-19T05:18:00.000Z | 159.0000 | 967332.0000  | 4139.0000 |
| 2026-10-19T05:23:00.000Z | 156.0000 | 959079.0000  | 3763.0000 |
| 2026-10-19T05:28:00.000Z | 203.0000 | 964979.0000  | 3628.0000 |
| 2026-10-19T05:33:00.000Z | 193.0000 | 945799.0000  | 3677.0000 |


[Open metric query builder in Dash0](${PROMQL_LINK})
${HINT}`
