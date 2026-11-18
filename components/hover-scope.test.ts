import { test, expect } from 'claude-code/testing'
import { hoverIdOf } from './measure.js'

// A hover scope lights every element of the plugin's under it, in any site: each chart scopes its own, so hovering
// one never shows another's card. The test tree leaves hover props out, so this checks the ids the charts take
test('two charts take different hover groups, even with the same series, and one chart keeps its own', () => {
    const a = hoverIdOf('timeseries-abc', JSON.stringify([[1, 2], [3, 4]]))
    expect(hoverIdOf('timeseries-abc', JSON.stringify([[1, 2], [3, 5]]))).not.toBe(a)
    expect(hoverIdOf('story-x/timeseries-abc', JSON.stringify([[1, 2], [3, 4]]))).not.toBe(a)
    expect(hoverIdOf('timeseries-abc', JSON.stringify([[1, 2], [3, 4]]))).toBe(a)
    expect(`${a}-284`.length).toBeLessThanOrEqual(64)
})
