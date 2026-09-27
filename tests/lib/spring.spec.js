import { describe, expect, it } from 'vitest'
import { isSettled, SPRINGS, stepSpring } from '@/lib/spring'

/** Run a spring for `seconds` at 60 fps; returns every frame. */
function simulate(from, to, spring, seconds, velocity = 0) {
  let s = { value: from, velocity }
  const frames = []
  for (let t = 0; t < seconds; t += 1 / 60) {
    s = stepSpring(s, to, spring, 1 / 60)
    frames.push(s)
  }
  return frames
}

describe('stepSpring', () => {
  it('critically damped: reaches the target without overshooting', () => {
    const frames = simulate(100, 0, SPRINGS.sheet, 1)
    expect(frames.every((f) => f.value >= -0.001)).toBe(true)
    expect(isSettled(frames.at(-1), 0)).toBe(true)
  })

  it('under-damped (0.8): overshoots a little, then settles', () => {
    const frames = simulate(100, 0, SPRINGS.flick, 1.5)
    const min = Math.min(...frames.map((f) => f.value))
    expect(min < 0 && min > -10).toBe(true)
    expect(isSettled(frames.at(-1), 0)).toBe(true)
  })

  it('keeps the initial velocity (velocity hand-off)', () => {
    const s = stepSpring({ value: 0, velocity: 1200 }, 0, SPRINGS.sheet, 0.001)
    expect(s.velocity > 1100 && s.velocity <= 1200).toBe(true) // only 1 ms of spring force applied
    expect(s.value > 1 && s.value < 1.3).toBe(true)
  })

  it('is frame-rate independent (one 32 ms step = two 16 ms steps)', () => {
    const a = stepSpring({ value: 80, velocity: -300 }, 0, SPRINGS.flick, 0.032)
    const b1 = stepSpring({ value: 80, velocity: -300 }, 0, SPRINGS.flick, 0.016)
    const b = stepSpring(b1, 0, SPRINGS.flick, 0.016)
    expect(a.value).toBeCloseTo(b.value, 6)
    expect(a.velocity).toBeCloseTo(b.velocity, 6)
  })

  it('response sets the pace: a snappier spring is closer after the same time', () => {
    const slow = simulate(100, 0, { dampingRatio: 1, response: 0.6 }, 0.2).at(-1).value
    const fast = simulate(100, 0, { dampingRatio: 1, response: 0.3 }, 0.2).at(-1).value
    expect(fast < slow).toBe(true)
  })
})
