import { describe, expect, it } from 'vitest'
import { pageStyle, pageTargets, pageTransition, UNDER } from '@/lib/pageTransition'

const r = (path, tab) => ({ path, matched: [{}], meta: tab ? { tab } : {} })

describe('pageTransition', () => {
  it('pushes when drilling down within a tab', () => {
    expect(pageTransition(r('/sites/3', 'home'), r('/home', 'home'))).toBe('push')
    expect(pageTransition(r('/navigate/3/map', 'map'), r('/navigate/3', 'map'))).toBe('push')
  })
  it('pops when going back up within a tab', () => {
    expect(pageTransition(r('/home', 'home'), r('/sites/3/audio', 'home'))).toBe('pop')
  })
  it('cross-fades between tabs and between siblings', () => {
    expect(pageTransition(r('/map', 'map'), r('/sites/3', 'home'))).toBe('fade')
    expect(pageTransition(r('/navigate/3/ar', 'map'), r('/navigate/3/map', 'map'))).toBe('fade')
  })
  it('keeps the map in place between the Map tab and navigation (one surface)', () => {
    const map = { path: '/map', matched: [{}], meta: { tab: 'map', mapSurface: true } }
    const nav = { path: '/navigate/3/map', matched: [{}], meta: { tab: 'map', mapSurface: true } }
    expect(pageTransition(nav, map)).toBe('none')
    expect(pageTransition(map, nav)).toBe('none')
  })
  it('plays nothing on first load or same path', () => {
    expect(pageTransition(r('/home', 'home'), undefined)).toBe('none')
    expect(pageTransition(r('/home', 'home'), { path: '/', matched: [] })).toBe('none')
    expect(pageTransition(r('/home', 'home'), r('/home', 'home'))).toBe('none')
  })
})

describe('pageTargets / pageStyle', () => {
  it('push and pop travel the same path in opposite directions', () => {
    const push = pageTargets('push')
    const pop = pageTargets('pop')
    expect(push.enter).toEqual({ from: 1, to: 0 })
    expect(pop.leave).toEqual({ from: 0, to: 1 })
    expect(push.leave.to).toBe(pop.enter.from)
    expect(pageTargets('fade')).toBeNull()
  })
  it('a page at rest has no inline transform', () => {
    expect(pageStyle(0)).toEqual({ transform: '', filter: '', boxShadow: '' })
  })
  it('the page underneath dims, the page on top casts a shadow', () => {
    expect(pageStyle(UNDER).filter).toBe('brightness(0.9200)')
    expect(pageStyle(0.5).transform).toBe('translateX(50.000%)')
    expect(pageStyle(0.5).boxShadow).not.toBe('')
  })
})
