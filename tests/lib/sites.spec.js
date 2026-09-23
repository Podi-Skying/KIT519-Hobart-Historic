import { describe, expect, it } from 'vitest'
import { SITES } from '@/data/sites'
import { filterSites, nearestSite, rankByLikes, walkMinutesFor } from '@/lib/sites'

describe('filterSites', () => {
  it('returns every site for the "all" category and an empty query', () => {
    expect(filterSites(SITES)).toHaveLength(SITES.length)
  })

  it('filters by category key', () => {
    const convict = filterSites(SITES, { category: 'convict' })
    expect(convict.map((s) => s.id)).toEqual([1, 4])
  })

  it('matches name, area and category label case-insensitively', () => {
    expect(filterSites(SITES, { query: 'SALA' }).map((s) => s.id)).toEqual([3])
    expect(filterSites(SITES, { query: 'battery point' }).map((s) => s.id)).toEqual([2, 5])
    expect(filterSites(SITES, { query: 'colonial living' }).map((s) => s.id)).toEqual([5])
  })

  it('combines category and query', () => {
    expect(filterSites(SITES, { category: 'convict', query: 'sal' })).toEqual([])
  })
})

describe('rankByLikes', () => {
  it('sorts by likes descending and keeps catalogue order on ties', () => {
    const likes = { 1: 5, 2: 10, 3: 5, 4: 1, 5: 10 }
    expect(rankByLikes(SITES, (s) => likes[s.id]).map((s) => s.id)).toEqual([2, 5, 1, 3, 4])
  })
})

describe('nearestSite', () => {
  it('picks the shortest walk', () => {
    const sites = [{ id: 'a', walkMinutes: 9 }, { id: 'b', walkMinutes: 3 }, { id: 'c', walkMinutes: 5 }]
    expect(nearestSite(sites).id).toBe('b')
  })
})

describe('walkMinutesFor', () => {
  const site = { walkMinutes: 8 }
  it('scales by route type', () => {
    expect(walkMinutesFor(site, 'normal')).toBe(8)
    expect(walkMinutesFor(site, 'accessible')).toBe(14)
    expect(walkMinutesFor(site, 'steep')).toBe(5)
  })
  it('never returns less than one minute and falls back to normal', () => {
    expect(walkMinutesFor({ walkMinutes: 1 }, 'steep')).toBe(1)
    expect(walkMinutesFor(site, 'unknown')).toBe(8)
  })
})
