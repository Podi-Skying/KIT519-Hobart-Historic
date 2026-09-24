import { ALL_CATEGORIES } from '@/data/categories'
import { ROUTE_TYPES } from '@/data/navigation'

/**
 * Filter sites by category key and free-text query (name, area, category).
 * @param {import('@/data/sites').HeritageSite[]} sites
 * @param {{category?: string, query?: string}} criteria
 */
export function filterSites(sites, { category = ALL_CATEGORIES, query = '' } = {}) {
  const needle = query.trim().toLowerCase()
  return sites.filter((site) => {
    if (category !== ALL_CATEGORIES && site.category !== category) return false
    if (!needle) return true
    return `${site.name} ${site.area} ${site.categoryLabel}`.toLowerCase().includes(needle)
  })
}

/**
 * Sort sites by like count, highest first. Ties keep catalogue order.
 * @param {import('@/data/sites').HeritageSite[]} sites
 * @param {(site: import('@/data/sites').HeritageSite) => number} likesOf
 */
export function rankByLikes(sites, likesOf) {
  return sites
    .map((site, index) => ({ site, index, likes: likesOf(site) }))
    .sort((a, b) => b.likes - a.likes || a.index - b.index)
    .map(({ site }) => site)
}

/** Closest site by walking time. */
export function nearestSite(sites) {
  return sites.reduce((best, site) => (site.walkMinutes < best.walkMinutes ? site : best), sites[0])
}

/**
 * Walking minutes for a route type (rounded, never below 1).
 * @param {{walkMinutes:number}} site
 * @param {string} routeTypeKey
 */
export function walkMinutesFor(site, routeTypeKey) {
  const type = ROUTE_TYPES.find((t) => t.key === routeTypeKey) ?? ROUTE_TYPES[0]
  return Math.max(1, Math.round(site.walkMinutes * type.factor))
}

/** Before this year a photo is labelled "archival". */
export const ARCHIVAL_BEFORE = 1950

/**
 * Sortable year for a photo's year label: the first four-digit year it mentions
 * ('c.1900' → 1900, '2005–2006' → 2005). Labels without one ('Present day' in any
 * language) count as today.
 * @param {string|null|undefined} label
 */
export function yearOf(label) {
  const match = /\d{4}/.exec(label ?? '')
  return match ? Number(match[0]) : Infinity
}

/**
 * Every photo of a site as one timeline, newest first: today's AR view, the gallery,
 * and the archival AR view. A photo used twice appears once (the time-travel entry,
 * which has the longer story, keeps the gallery title). Ties keep catalogue order.
 * @param {import('@/data/sites').HeritageSite} site  (localised or not)
 * @returns {{image: string, year: string|null, title: string, text: string, sortYear: number, archival: boolean}[]}
 */
export function siteTimeline(site) {
  const tt = site.timeTravel
  const entries = [
    ...(tt ? [{ image: tt.presentImage, year: null, title: site.name, text: tt.presentCaption }] : []),
    ...site.gallery.map((p) => ({ image: p.image, year: p.year, title: p.caption, text: p.description })),
    ...(tt ? [{ image: tt.pastImage, year: tt.pastYear, title: site.name, text: tt.pastCaption }] : []),
  ]
  const byImage = new Map()
  for (const entry of entries) {
    const seen = byImage.get(entry.image)
    // Later time-travel entry wins the text; the gallery keeps its title
    byImage.set(entry.image, seen ? { ...seen, year: entry.year ?? seen.year, text: entry.text } : entry)
  }
  return [...byImage.values()]
    .map((entry, index) => ({ ...entry, index, sortYear: yearOf(entry.year) }))
    .sort((a, b) => b.sortYear - a.sortYear || a.index - b.index)
    .map(({ index, ...entry }) => ({ ...entry, archival: entry.sortYear < ARCHIVAL_BEFORE }))
}
