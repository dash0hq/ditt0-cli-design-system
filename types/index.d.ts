// The $.ditt0 noun: Ditt0's contract for other Claude Code mods. Open a live page in a pane, drawn from Dash0's
// design system, by describing it as plain JSON. A mod that lists "ditt0-cli-design-system" under dependencies in its
// plugin.json calls await $.ditt0.open(spec). Only JSON crosses: no functions, no element trees

/** The time ranges a page offers; its queries end on the range's last whole step. */
export type Ditt0Range = '15m' | '1h' | '6h' | '24h'

/** An MCP call: the tool's name on the page's server, and its arguments. */
export type Ditt0Query = { tool: string; args?: Record<string, unknown> }

/** Values over time, as a chart draws them: every series one length, null for a gap. */
export type Ditt0Series = { name: string; values: (number | null)[]; attributes?: Record<string, string> }
export type Ditt0SeriesData = { series: Ditt0Series[]; times?: string[] }
export type Ditt0BarsData = { bars: { label: string; value: number }[] } | { series: Ditt0Series[]; labels: string[] }
/** A table cell: text, a Badge, or text in a status colour. */
export type Ditt0Cell = string | number | { text: string; badge: 'default' | 'critical' | 'attention' | 'success' | 'severe' | 'primary' } | { text: string; status: 'error' | 'warning' | 'info' | 'healthy' | 'debug' | 'unknown' }
export type Ditt0Column = { key: string; label?: string; align?: 'left' | 'right' }
export type Ditt0TableData = { columns?: Ditt0Column[]; rows: Record<string, Ditt0Cell>[] }
export type Ditt0StatData = { value?: number | null; values?: (number | null)[] }

/**
 * Where a data block's data comes from: its own (inline), or what Dash0 answers. promql is a Dash0 PromQL query,
 * its time range and step the page range's (write [$step] as the rate window); query is any MCP call whose tool has a
 * parser (promql, getSpans, getServiceCatalog, getFailedChecks).
 */
export type Ditt0Source = { promql?: string; queries?: Ditt0PromqlQuery[]; query?: Ditt0Query; dataset?: string }

/**
 * One of a block's queries: each is asked, and every series drawn together. name is a template, such as
 * '{{service_name}} in', each series' label put in.
 */
export type Ditt0PromqlQuery = { promql: string; name?: string }

/** How a stat, gauge, pie slice, bar or table row reads a series as one value; default 'last'. */
export type Ditt0Calculation = 'first' | 'last' | 'first-number' | 'last-number' | 'mean' | 'sum' | 'min' | 'max'

/** A stat or gauge takes the colour of the highest threshold its value reaches. */
export type Ditt0Threshold = { value: number; color: 'healthy' | 'warning' | 'error' | 'info' | 'debug' | 'unknown' }

/** A unit the charts scale: seconds, milliseconds, bytes, percent, ratio, or text such as '/s'. */
export type Ditt0Unit = string

export type Ditt0StatItem = Ditt0Source & Ditt0StatData & { id?: string; label: string; unit?: Ditt0Unit; goodWhen?: 'up' | 'down'; calculation?: Ditt0Calculation; thresholds?: Ditt0Threshold[] }

/** Every block has a type; a block with an id can be given new data with $.ditt0.update. */
export type Ditt0Block =
    | { type: 'heading'; id?: string; text: string; level?: 'h1' | 'h2' | 'h3' }
    | { type: 'text'; id?: string; text: string; color?: 'default' | 'subtle' | 'intense' | 'error' | 'warning' | 'info' | 'healthy' }
    | { type: 'markdown'; id?: string; title?: string; text: string }
    | { type: 'stats'; id?: string; items: Ditt0StatItem[] }
    | (Ditt0Source & Ditt0StatData & Partial<Ditt0SeriesData> & { type: 'gauge'; id?: string; title?: string; subtitle?: string; unit?: Ditt0Unit; calculation?: Ditt0Calculation; min?: number; max?: number; thresholds?: Ditt0Threshold[] })
    | (Ditt0Source & Partial<Ditt0SeriesData> & { type: 'timeseries'; id?: string; title?: string; subtitle?: string; unit?: Ditt0Unit; lineType?: 'braille' | 'box' | 'bars'; stacked?: boolean })
    | (Ditt0Source & { type: 'bars'; id?: string; title?: string; subtitle?: string; alt?: string; unit?: Ditt0Unit; orientation?: 'vertical' | 'horizontal'; stacked?: boolean; calculation?: Ditt0Calculation; bars?: { label: string; value: number }[]; series?: Ditt0Series[]; labels?: string[] })
    | (Ditt0Source & { type: 'pie'; id?: string; title?: string; subtitle?: string; unit?: Ditt0Unit; variant?: 'round' | 'squares'; calculation?: Ditt0Calculation; slices?: { label: string; value: number }[] })
    | { type: 'gantt'; id?: string; title?: string; subtitle?: string; tasks: { label: string; section?: string; start: number | string; end?: number | string; milestone?: boolean }[] }
    | { type: 'diagram'; id?: string; title?: string; subtitle?: string; source: string }
    | (Ditt0Source & Partial<Ditt0TableData> & { type: 'table'; id?: string; title?: string; calculation?: Ditt0Calculation; spans?: { filters?: { key: string; operator?: string; value?: string | string[] }[]; limit?: number; dataset?: string; sort?: 'newest' | 'slowest' } })
    | { type: 'badge'; id?: string; label: string; color?: 'default' | 'critical' | 'attention' | 'success' | 'severe' | 'primary' }
    | { type: 'tags'; id?: string; tags: { label: string; value?: string }[] }
    | { type: 'link'; id?: string; href?: string; label?: string }
    | { type: 'row' | 'column'; id?: string; blocks: Ditt0Block[] }
    | { type: 'card'; id?: string; title?: string; subtitle?: string; blocks: Ditt0Block[] }

/** A page: drawn in a pane of its own, ditt0-page-<id>. The same id again replaces the page. */
export type Ditt0Page = {
    /** 1 to 53 letters, digits, _ or - */
    id: string
    title: string
    /** The MCP server its queries ask; default the Dash0 server Claude last used, else 'claude.ai Dash0'. */
    server?: string
    /** The Dash0 dataset its queries ask; default 'default'. A block may name its own. */
    dataset?: string
    /** Default '1h'. */
    range?: Ditt0Range
    /** How often it asks again while Auto-refresh is on; default 30000, at least 5000. */
    refreshMs?: number
    /** Required, unless perses is given. */
    blocks?: Ditt0Block[]
    /**
     * A Perses dashboard drawn in place of blocks: an object, or its JSON or YAML text. Its own id, title, range and
     * refresh are used unless the fields above are given; blocks given replace its panels.
     */
    perses?: unknown
    /** With perses: what to set its variables to; an array for several, '$__all' for all. */
    variables?: Record<string, string | string[]>
}

/** New data for an open page, by block id (a stat's by its item id), or its blocks replaced. */
export type Ditt0Update = {
    id: string
    blocks?: Ditt0Block[]
    data?: Record<string, Ditt0SeriesData | Ditt0BarsData | Ditt0TableData | Ditt0StatData>
}

/** opened is false where no pane can draw (claude -p); problems names what was left out or refused. */
export type Ditt0Opened = { id: string; opened: boolean; problems?: string[] }
export type Ditt0Updated = { id: string; updated: boolean; problems?: string[] }
export type Ditt0Closed = { id: string; closed: boolean }

export type Ditt0 = {
    /** Opens the page in a pane, asks its queries now and every refreshMs, and stops when the pane closes. */
    open: (spec: Ditt0Page) => Promise<Ditt0Opened>
    /** Pushes new data or blocks to an open page, and draws it again. */
    update: (update: Ditt0Update) => Promise<Ditt0Updated>
    /** Closes the page's pane. */
    close: (page: { id: string }) => Promise<Ditt0Closed>
}

declare module 'claude-code' {
    interface EngineInterface {
        ditt0: Ditt0
    }
}
