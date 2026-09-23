import { describe, expect, it } from 'vitest'
import { formatClock, formatKm, pluralize } from '@/lib/format'

describe('format helpers', () => {
  it('formatClock pads seconds and clamps negatives', () => {
    expect(formatClock(125)).toBe('2:05')
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(-3)).toBe('0:00')
  })

  it('pluralize', () => {
    expect(pluralize(1, 'site')).toBe('1 site')
    expect(pluralize(3, 'site')).toBe('3 sites')
    expect(pluralize(0, 'stop')).toBe('0 stops')
  })

  it('formatKm keeps one decimal', () => {
    expect(formatKm(0.4)).toBe('0.4 km')
    expect(formatKm(1)).toBe('1.0 km')
  })
})
