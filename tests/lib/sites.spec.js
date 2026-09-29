import { describe, expect, it } from 'vitest'
import { SITES, smallVersion } from '@/data/sites'
import { filterSites, nearestSite, rankByLikes, siteTimeline, walkMinutesFor, yearOf } from '@/lib/sites'
import { getSiteById } from '@/data/sites'
import { NARRATION } from '@/data/narration'
import { CATEGORIES, categoryIcon } from '@/data/categories'
import { ICONS } from '@/assets/icons'

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
    expect(filterSites(SITES, { query: 'battery point' }).map((s) => s.id)).toEqual([2, 5, 6, 12])
    expect(filterSites(SITES, { query: 'colonial living' }).map((s) => s.id)).toEqual([5, 19])
  })

  it('combines category and query', () => {
    expect(filterSites(SITES, { category: 'convict', query: 'sal' })).toEqual([])
  })
})

describe('rankByLikes', () => {
  it('sorts by likes descending and keeps catalogue order on ties', () => {
    const likes = { 1: 5, 2: 10, 3: 5, 4: 1, 5: 10 }
    const tour = SITES.filter((s) => s.id in likes)
    expect(rankByLikes(tour, (s) => likes[s.id]).map((s) => s.id)).toEqual([2, 5, 1, 3, 4])
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
    expect(years).toEqual([
      null, 'Present day', 'Present day', 'Present day', '2024', '2024', '2013', '2013', '2013', '2009', '1914–1941', '1892', '1844',
    ])
  })

  it('shows a photo used twice only once, keeping the time-travel story', () => {
    const timeline = siteTimeline(getSiteById(4))
    const images = timeline.map((p) => p.image)
    expect(new Set(images).size).toBe(images.length)
    const archival = timeline.filter((p) => p.archival)
    expect(archival.map((p) => p.year)).toEqual(['c.1900', 'c.1860'])
    expect(archival[0]).toMatchObject({ year: 'c.1900', title: 'Old Trinity and Penitentiary' })
    expect(archival[0].text).toMatch(/Around 1900/)
  })

  it('gives sites without archival imagery a timeline of their gallery', () => {
    const years = siteTimeline(getSiteById(2)).map((p) => p.year)
    expect(years).toEqual(['2022', '2015', '2013', '2013', '2011', '2010', '2010'])
    expect(siteTimeline(getSiteById(2)).every((p) => !p.archival)).toBe(true)
  })
})

describe('site photos', () => {
  it('tour sites have at least 10 photos, every site at least one, each credited to its author and licence', () => {
    for (const site of SITES) {
      expect(site.gallery.length).toBeGreaterThanOrEqual(NARRATION[site.id] ? 10 : 1)
      for (const photo of site.gallery.filter((p) => p.image.startsWith('https://live.staticflickr.com') || p.image.includes('wikimedia.org'))) {
        expect(photo.credit?.author).toBeTruthy()
        expect(photo.credit?.license).toBeTruthy()
        expect(photo.credit?.url).toMatch(/^https:\/\//)
      }
    }
  })

  it('leaves interiors and close-ups out of the AR playback', () => {
    const site = getSiteById(2)
    const shown = new Set(siteTimeline(site).map((p) => p.image))
    for (const photo of site.gallery) expect(shown.has(photo.image)).toBe(!photo.detail)
  })
})

describe('smallVersion', () => {
  it('asks each host for a small copy (Commons only serves standard widths)', () => {
    expect(smallVersion('https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/A.jpg/1280px-A.jpg')).toBe(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/A.jpg/330px-A.jpg',
    )
    expect(smallVersion('https://upload.wikimedia.org/wikipedia/commons/a/a1/HobartGaol.jpg')).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/HobartGaol.jpg/330px-HobartGaol.jpg',
    )
    expect(smallVersion('https://live.staticflickr.com/5475/10375580395_f235b922be_b.jpg')).toBe(
      'https://live.staticflickr.com/5475/10375580395_f235b922be_n.jpg',
    )
    expect(smallVersion('https://live.staticflickr.com/3710/11994675884_a727b4dc20.jpg')).toBe(
      'https://live.staticflickr.com/3710/11994675884_a727b4dc20_n.jpg',
    )
  })
})


describe('site catalogue', () => {
  it('ids are unique, and every site added from the heritage register carries its THR id', () => {
    expect(new Set(SITES.map((s) => s.id)).size).toBe(SITES.length)
    const thr = SITES.filter((s) => s.thr).map((s) => s.thr)
    expect(new Set(thr).size).toBe(thr.length)
    for (const site of SITES.filter((s) => !NARRATION[s.id])) expect(Number.isInteger(site.thr)).toBe(true)
  })

  it('every site belongs to a filter chip whose pin glyph exists', () => {
    const keys = new Set(CATEGORIES.map((c) => c.key))
    for (const site of SITES) {
      expect(keys.has(site.category), site.name).toBe(true)
      expect(ICONS[categoryIcon(site.category)], site.category).toBeTruthy()
    }
  })

  it('a site with one photo uses it for the hero and both AR views', () => {
    for (const site of SITES.filter((s) => s.gallery.length === 1)) {
      expect(site.arImage).toBe(site.image)
      expect(site.arApproachImage).toBe(site.image)
      expect(site.gallery[0].credit?.url).toMatch(/^https:\/\//)
    }
  })
})
