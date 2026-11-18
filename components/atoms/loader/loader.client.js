// A Loader's glyph, moving on the surface's own frame clock: the hooks module draws nothing again while it runs.
// props: frames, the glyph of each frame; colors, the colour of each (one for all, or one a frame); ms, a frame's time
export default function LoaderClient(props, client) {
    const { Text } = client.elements
    const { frames, colors, ms, label } = props
    // The timer starts once, on the first call, and keeps its own count: it advances that count and hands a copy
    // as the state, so each tick draws the next frame. (Reading the first call's state in the timer would set the
    // same frame on every tick)
    if (client.state === undefined) {
        const count = { frame: 0 }
        client.every(ms, () => {
            count.frame = (count.frame + 1) % frames.length
            client.setState({ frame: count.frame })
        })
        client.setState({ frame: 0 })
    }
    const frame = (client.state?.frame ?? 0) % frames.length
    return Text({ children: [
        Text({ color: colors[frame % colors.length], children: [frames[frame]] }),
        ...(label ? [Text({ dimColor: true, children: [` ${label}`] })] : []),
    ] })
}
