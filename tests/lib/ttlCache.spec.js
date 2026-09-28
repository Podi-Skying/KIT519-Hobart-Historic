import { describe, expect, it } from 'vitest'
import { CACHE_TTL_MS, createTtlCache } from '@/lib/ttlCache'

describe('ttlCache', () => {
  it('keeps entries for 3 minutes, then drops them', () => {
    let t = 0
    const cache = createTtlCache({ now: () => t })
    cache.set('a', 1)
    t = CACHE_TTL_MS - 1
    expect(cache.get('a')).toBe(1)
    expect(cache.has('a')).toBe(true)
    t = CACHE_TTL_MS
    expect(cache.get('a')).toBeUndefined()
    expect(cache.has('a')).toBe(false)
    expect(CACHE_TTL_MS).toBe(180000)
  })
  it('sweeps expired entries even if they are never read again', () => {
    let t = 0
    const cache = createTtlCache({ ttl: 100, now: () => t })
    cache.set('a', 1).set('b', 2)
    t = 150
    cache.sweep()
    expect(cache.size).toBe(0)
  })
  it('refreshes an entry that is set again and caps the size (oldest first)', () => {
    let t = 0
    const cache = createTtlCache({ ttl: 100, max: 2, now: () => t })
    cache.set('a', 1)
    t = 90
    cache.set('a', 2) // renewed at 90
    t = 150
    expect(cache.get('a')).toBe(2)
    cache.set('b', 3).set('c', 4)
    expect(cache.has('a')).toBe(false) // oldest pushed out by the cap
    expect(cache.size).toBe(2)
  })
})
