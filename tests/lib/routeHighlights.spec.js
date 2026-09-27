import { describe, expect, it } from 'vitest'
import { routeHighlights } from '@/lib/routeHighlights'

const at = (lat, lng) => ({ lat, lng })
const base = {
  maxGrade: 0.1,
  steepestAt: at(-42.89, 147.33),
  steepestUphill: true,
  highestAt: at(-42.887, 147.337),
  highestM: 60,
  lowestM: 10,
  via: null,
  viaKind: null,
  viaAt: null,
}

describe('routeHighlights', () => {
  it('Normal only flags a real hill', () => {
    expect(routeHighlights('normal', base).map((h) => h.kind)).toEqual(['steepest'])
    expect(routeHighlights('normal', { ...base, maxGrade: 0.05 })).toEqual([])
  })
  it('Accessible shows the flat corridor it takes, and warns about any pinch ≥ 5 %', () => {
    const flat = { ...base, maxGrade: 0.03, via: 'Franklin Wharf', viaKind: 'flat', viaAt: at(-42.88185, 147.335545) }
    const h = routeHighlights('accessible', flat)
    expect(h.map((x) => x.kind)).toEqual(['via'])
    expect(h[0].message).toBe('routeHighlights.viaFlat')
    expect(h[0].params).toEqual({ place: 'Franklin Wharf' })
    expect(routeHighlights('accessible', { ...flat, maxGrade: 0.06 }).map((x) => x.kind)).toEqual(['via', 'steepest'])
  })
  it('Steep shows the top (the view) and the steepest climb', () => {
    const h = routeHighlights('steep', base)
    expect(h.map((x) => x.kind)).toEqual(['summit', 'steepest'])
    expect(h[0].params).toEqual({ m: 60 })
  })
  it('says descent when the steepest stretch goes downhill', () => {
    expect(routeHighlights('normal', { ...base, steepestUphill: false })[0].message).toBe('routeHighlights.steepestDown')
  })
  it('never stacks two pins on the same spot, and returns nothing without a planned route', () => {
    const same = { ...base, steepestAt: base.highestAt }
    expect(routeHighlights('steep', same)).toHaveLength(1)
    expect(routeHighlights('steep', null)).toEqual([])
  })
})
