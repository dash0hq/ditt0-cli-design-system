import { FlowDiagram } from './flow-diagram.jsx'

export default { title: 'Components/Data/FlowDiagram', component: FlowDiagram }

// A request's path through Dash0's API, top-down, with a decision: authenticated requests go on to the control
// plane and Postgres, the rest end at a 401
export const Default = {
    args: {
        source: `flowchart TD
    client[Client] --> api[api]
    api --> auth{Token valid?}
    auth -->|yes| cp[order-history-api]
    auth -->|no| deny[401]
    cp --> pg[(Postgres)]`,
    },
}

// An order's way through a shop, left to right; in a narrow Box it turns top-down
export const Pipeline = {
    args: {
        source: `flowchart LR
    cart[Shopping cart] --> checkout[Checkout page] --> payment[Payment] --> email[Email]`,
    },
}

// The same request as a sequence: who calls whom, in order, replies dashed
export const Sequence = {
    args: {
        source: `sequenceDiagram
    participant C as Client
    participant A as api
    participant P as order-history-api
    C->>A: GET /api/order
    A->>P: check token
    P-->>A: ok
    A-->>C: 200 OK`,
    },
}

// A check's states: where it starts and ends, and what moves it between them
export const State = {
    args: {
        source: `stateDiagram-v2
    [*] --> Pending
    Pending --> Firing: threshold crossed
    Firing --> Resolved: back under
    Resolved --> [*]`,
    },
}

// A trace and its spans: each class's fields and methods in its own band
export const Class = {
    args: {
        source: `classDiagram
    class Span {
        +string traceId
        +duration()
    }
    class Trace
    Trace --> Span : has`,
    },
}

// Source that isn't a diagram drawn here: why, dim, in its place
export const Unsupported = {
    args: { source: 'pie title Spans by status\n    "UNSET" : 96\n    "ERROR" : 4' },
}

// An ER diagram, a kind not drawn here: why, in its place
export const Entity = {
    args: { source: 'erDiagram\n    SERVICE ||--o{ SPAN : emits' },
}

// Source the renderer can't read, here a direction Mermaid doesn't have: its message, dim, never an error
export const Invalid = {
    args: { source: 'flowchart sideways\n    api --> postgres' },
}
