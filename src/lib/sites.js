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
