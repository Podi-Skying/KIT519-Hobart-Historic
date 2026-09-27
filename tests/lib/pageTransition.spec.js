import { describe, expect, it } from 'vitest'
import { pageTransition } from '@/lib/pageTransition'

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
  it('plays nothing on first load or same path', () => {
    expect(pageTransition(r('/home', 'home'), undefined)).toBe('none')
    expect(pageTransition(r('/home', 'home'), { path: '/', matched: [] })).toBe('none')
    expect(pageTransition(r('/home', 'home'), r('/home', 'home'))).toBe('none')
  })
})
