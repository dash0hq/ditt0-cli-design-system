// Mounts one story alone, the way Storybook opens one by id: ditt0-story:<id>, ?theme=light for the light colours
export const SURFACES = ['terminal', 'desktop', 'mobile'] as const

export const mountStory = ($: any, id: string, surface: string, theme?: 'light' | 'dark') =>
    $.ui.mount({
        plugin: 'ditt0-cli-design-system',
        surface,
        component: 'Pane',
        requestId: `ditt0-story:${id}${theme ? `?theme=${theme}` : ''}`,
        props: { title: id, isFocused: true },
    })

// The key of the first Client a mounted story drew: a chart's measure region (components/measure.js).
// ui.resize({ columns, rows, in: key }) gives the chart that width, as the Box it sits in would
export const clientKey = async (ui: any): Promise<string> => (await ui.find({ type: 'Client' } as any))?.props.key

// What reached the clipboard and the toasts, from hooks under the plugin's: a clipboard that takes every copy, or
// one that has none
export const watchCopies = (on: any, isCopied = true) => {
    const copied: string[] = []
    const toasts: string[] = []
    on('ui.copy', async ($: any, e: any) => { copied.push(e.text); return { value: isCopied ? { isCopied: true } : { isCopied: false, reason: 'no-clipboard' } } })
    on('ui.toast', async ($: any, e: any) => { toasts.push(e.text); return { value: undefined } })
    return { copied, toasts }
}
