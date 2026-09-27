import { describe, expect, it } from 'vitest'
import { advancePosition, arTimeline, layerOpacity, SECONDS_PER_PHOTO } from '@/lib/timeline'

describe('advancePosition', () => {
  it('moves at a constant speed: one photo per SECONDS_PER_PHOTO', () => {
    expect(advancePosition(0, SECONDS_PER_PHOTO * 1000, 4)).toBe(1)
    expect(advancePosition(1, 500, 4, 5)).toBeCloseTo(1.1, 6)
    // same distance for the same time, wherever you are
    expect(advancePosition(2.3, 1000, 4) - 2.3).toBeCloseTo(advancePosition(0.4, 1000, 4) - 0.4, 9)
  })
  it('stops at the oldest photo', () => {
    expect(advancePosition(3.9, 60_000, 4)).toBe(4)
  })
})

describe('layerOpacity', () => {
  it('blends only the two neighbours', () => {
    expect(layerOpacity(1, 1.25)).toBe(1)
    expect(layerOpacity(2, 1.25)).toBe(0.25)
    expect(layerOpacity(0, 1.25)).toBe(0)
    expect(layerOpacity(3, 1.25)).toBe(0)
  })
})

describe('arTimeline', () => {
  const tl = [
    { image: 'today.jpg', year: null, title: 'Tower', text: 'Now' },
    { image: '2017.jpg', year: '2017', title: 'Tower', text: 'Clock' },
  ]
  it('uses the live camera view as "today"', () => {
    const out = arTimeline(tl, 'camera.jpg')
    expect(out.map((e) => e.image)).toEqual(['camera.jpg', '2017.jpg'])
    expect(out[0].text).toBe('Now')
  })
  it('adds a "today" step when the timeline has none', () => {
    expect(arTimeline([tl[1]], 'camera.jpg').map((e) => e.image)).toEqual(['camera.jpg', '2017.jpg'])
  })
})
