// Reports the width of the region it is given, and its height, and draws nothing
export default function Measure(props, client) {
    if (client.columns > 0) client.post({ columns: client.columns, rows: client.rows })
    return client.elements.Box({})
}
