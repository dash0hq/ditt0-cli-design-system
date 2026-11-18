import { Box } from './box.jsx'
import { Text } from '../text/text.jsx'
import { Badge } from '../badge/badge.jsx'

export default { title: 'Components/Layout/Box', component: Box }

// A story with a render draws its own children, as a Storybook story with a render function
export const Row = {
    args: { direction: 'row', gap: 1 },
    render: (args) => (
        <Box {...args}>
            <Badge label="Critical" color="critical" />
            <Text>checkout-service p99 latency</Text>
        </Box>
    ),
}

export const Bordered = {
    args: { border: true, padding: 1 },
    render: (args) => (
        <Box {...args}>
            <Text color="intense">api</Text>
            <Text color="subtle">1,128 req/s, p99 371 ms</Text>
        </Box>
    ),
}
