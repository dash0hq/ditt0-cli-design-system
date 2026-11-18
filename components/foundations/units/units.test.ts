import { test, expect } from 'claude-code/testing'
import { mountStory } from '../../../tests/story.ts'
import { formatValue, scaleFor, unitLabel } from './units.js'

test('a value scales to its size, a space before an abbreviation (UNIT-001)', () => {
    expect(formatValue(0.00085, 'seconds')).toBe('850 μs')
    expect(formatValue(1800, 'milliseconds')).toBe('1.8 s')
    expect(formatValue(1200, 'bytes')).toBe('1.2 kB')
    expect(formatValue(3.2e9, 'By')).toBe('3.2 GB')
    expect(formatValue(42.13, 'percent')).toBe('42.1%')
    expect(formatValue(0.5, 'ratio')).toBe('50%')
    expect(formatValue(null, 'bytes')).toBe('no data')
})

test('short names scale as the units they stand for', () => {
    expect(formatValue(166, 'ms')).toBe('166 ms')
    expect(formatValue(0.4, 's')).toBe('400 ms')
    expect(formatValue(2048, 'B')).toBe('2.05 kB')
})

test('a count takes K from 10,000, to 3 significant digits; any other unit follows the number', () => {
    expect(formatValue(1128, '/s')).toBe('1128/s')
    expect(formatValue(12521, 'decimal')).toBe('12.5K')
    expect(formatValue(12500, '/s')).toBe('12.5K/s')
    expect(formatValue(3, 'spans')).toBe('3 spans')
})

test('one scale for many values, from the largest, so a column shares a unit (UNIT-002)', () => {
    const scale = scaleFor('milliseconds', 698.51)
    expect(formatValue(0.84, 'milliseconds', scale)).toBe('0.84 ms')
    expect(formatValue(698.51, 'milliseconds', scale)).toBe('699 ms')
    expect(unitLabel('bytes', 510e9)).toBe('GB')
})

test('the units page writes each unit at a few sizes', async ($) => {
    const ui = await mountStory($, 'foundations-units--default', 'terminal')
    expect(await ui.find({ type: 'Text', text: '230 GB' } as any)).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '850 μs' } as any)).toBeDefined()
    await ui.unmount()
})

test('bytes per second scale as bytes do, per second, and keep one scale on an axis', () => {
    expect(formatValue(4.5e6, 'bytes/s')).toBe('4.5 MB/s')
    expect(formatValue(812, 'B/s')).toBe('812 B/s')
    expect(formatValue(2.1e12, 'By/s')).toBe('2.1 TB/s')
    expect(unitLabel('bytes/s', 3e9)).toBe('GB/s')
    expect(formatValue(1.5e5, 'bytes/s', scaleFor('bytes/s', 2e6))).toBe('0.15 MB/s')
})
