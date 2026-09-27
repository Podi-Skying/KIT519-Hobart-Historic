import { describe, expect, it } from 'vitest'
import { EDGE_MARGIN, clamp, horizontalRange, softClamp } from '@/lib/bubble'

describe('horizontalRange', () => {
  const stage = { left: 0, width: 400 }
  it('lets a bubble reach the screen edge minus half its width (not a fixed 88 %)', () => {
    const { minX, maxX } = horizontalRange(stage, stage, 80)
    expect(minX).toBeCloseTo(((40 + EDGE_MARGIN) / 400) * 100)
    expect(maxX).toBeCloseTo(((400 - 40 - EDGE_MARGIN) / 400) * 100)
    expect(maxX).toBeGreaterThan(88)
  })
  it('follows the visible stage when the parallax layer is shifted', () => {
    const shifted = { left: -30, width: 400 } // layer moved 30px left by the gyro
    const { maxX } = horizontalRange(stage, shifted, 80)
    // the right limit is still the screen edge, i.e. further along the shifted layer
    expect((maxX / 100) * 400 - 30).toBeCloseTo(400 - 40 - EDGE_MARGIN)
  })
})

describe('softClamp', () => {
  it('is 1:1 inside the range and resists progressively outside it', () => {
    expect(softClamp(50, 10, 90)).toBe(50)
    const a = softClamp(100, 10, 90) - 90
    const b = softClamp(120, 10, 90) - 90
    expect(a).toBeGreaterThan(0)
    expect(a).toBeLessThan(10)
    expect(b).toBeGreaterThan(a)
    expect(b - a).toBeLessThan(20)
    expect(softClamp(0, 10, 90)).toBeLessThan(10)
  })
  it('clamp snaps back into range', () => {
    expect(clamp(120, 10, 90)).toBe(90)
  })
})
