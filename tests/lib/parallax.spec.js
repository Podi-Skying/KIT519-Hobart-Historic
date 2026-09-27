import { describe, expect, it } from 'vitest'
import { FULL_TILT_DEG, overscan, tiltOffset, wrap180 } from '@/lib/parallax'

const max = { x: 30, y: 50 }
const base = { beta: 60, gamma: 0 }

describe('tiltOffset', () => {
  it('is 0 in the starting pose', () => {
    const o = tiltOffset(base, base, max)
    expect(Math.abs(o.x)).toBe(0)
    expect(Math.abs(o.y)).toBe(0)
  })
  it('tilting right slides the scene left; tilting the top away slides it down', () => {
    const o = tiltOffset({ beta: 60 + FULL_TILT_DEG / 2, gamma: FULL_TILT_DEG / 2 }, base, max)
    expect(o.x).toBe(-15)
    expect(o.y).toBe(25)
  })
  it('never leaves the margin', () => {
    const o = tiltOffset({ beta: 150, gamma: -80 }, base, max)
    expect(o).toEqual({ x: 30, y: 50 })
  })
  it('does not jump when an angle wraps past ±180°', () => {
    expect(wrap180(350)).toBe(-10)
    expect(wrap180(-190)).toBe(170)
  })
})

describe('overscan', () => {
  it('is half the extra size on each side', () => {
    expect(overscan({ width: 400, height: 800 }, 1.1)).toEqual({ x: 20, y: 40 })
  })
})
