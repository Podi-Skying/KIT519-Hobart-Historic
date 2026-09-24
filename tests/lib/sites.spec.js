import { describe, expect, it } from 'vitest'
import { SITES } from '@/data/sites'
import { filterSites, nearestSite, rankByLikes, siteTimeline, walkMinutesFor, yearOf } from '@/lib/sites'
import { getSiteById } from '@/data/sites'

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

describe('yearOf', () => {
  it('reads the first four-digit year and treats labels without one as today', () => {
    expect(yearOf('1844')).toBe(1844)
    expect(yearOf('c.1900')).toBe(1900)
    expect(yearOf('2005–2006')).toBe(2005)
    expect(yearOf('Present day')).toBe(Infinity)
    expect(yearOf(null)).toBe(Infinity)
  })
})

describe('siteTimeline', () => {
  it('orders every photo of a site newest first, archival views last', () => {
    const years = siteTimeline(getSiteById(1)).map((p) => p.year)
    expect(years).toEqual([null, 'Present day', 'Present day', 'Present day', '1892', '1844'])
  })

  it('shows a photo used twice only once, keeping the time-travel story', () => {
    const timeline = siteTimeline(getSiteById(4))
    const images = timeline.map((p) => p.image)
    expect(new Set(images).size).toBe(images.length)
    const archival = timeline.filter((p) => p.archival)
    expect(archival).toHaveLength(1)
    expect(archival[0]).toMatchObject({ year: 'c.1900', title: 'Old Trinity and Penitentiary' })
    expect(archival[0].text).toMatch(/Around 1900/)
  })

  it('gives sites without archival imagery a timeline of their gallery', () => {
    const years = siteTimeline(getSiteById(2)).map((p) => p.year)
    expect(years).toEqual(['2022', '2015', '2013', '2013'])
    expect(siteTimeline(getSiteById(2)).every((p) => !p.archival)).toBe(true)
  })
})
