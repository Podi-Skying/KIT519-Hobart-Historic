import { describe, expect, it } from 'vitest'
import { createVelocityTracker, project, releaseEasing, rubberband } from '@/lib/gesture'

describe('project', () => {
  it('matches Apple’s exponential-decay projection', () => {
    expect(Math.round(project(1, 0.99))).toBe(99)
    expect(project(-0.5, 0.998)).toBeCloseTo(-249.5)
    expect(project(0)).toBe(0)
  })
})

describe('rubberband', () => {
  it('follows less the further it is pulled, and keeps the sign', () => {
    const a = rubberband(50, 400)
    const b = rubberband(200, 400)
    expect(a > 0 && a < 50).toBe(true)
    expect(b > a && b < 200 * 0.55).toBe(true)
    expect(rubberband(-50, 400)).toBe(-a)
    expect(rubberband(0, 400)).toBe(0)
  })
})

describe('createVelocityTracker', () => {
  it('measures recent speed, not the average since the press', () => {
    const v = createVelocityTracker()
    v.reset(0, 0)
    v.add(1000, 10) // long, slow hold
    v.add(1040, 50)
    v.add(1080, 90) // quick flick
    expect(v.velocity()).toBe(1)
  })
  it('reaches back when the last samples share a timestamp', () => {
    const v = createVelocityTracker()
    v.reset(0, 0)
    v.add(50, 35)
    v.add(50, 70)
    expect(v.velocity()).toBe(1.4)
  })
  it('is 0 with a single sample', () => {
    const v = createVelocityTracker()
    v.reset(0, 0)
    expect(v.velocity()).toBe(0)
  })
})

describe('releaseEasing', () => {
  it('starts from rest when the finger stopped', () => {
    expect(releaseEasing(0, 100, 220)).toBe('cubic-bezier(0.25, 0, 0.3, 1)')
  })
  it('starts at the finger’s speed (slope = v·T/d), capped so it never overshoots', () => {
    expect(releaseEasing(0.5, 220, 220)).toBe('cubic-bezier(0.25, 0.125, 0.3, 1)')
    expect(releaseEasing(10, 50, 220)).toBe('cubic-bezier(0.25, 1, 0.3, 1)')
  })
})
