/**
 * Short-lived caches for API results (routes, route options, elevations): an entry is used for
 * up to CACHE_TTL_MS and then dropped, so a long session never piles up stale data and memory.
 * Pure (clock injectable) — unit-tested in tests/lib/ttlCache.spec.js.
 */

/** How long any cached API result lives: 3 minutes (owner's choice). */
export const CACHE_TTL_MS = 3 * 60 * 1000

/**
 * @param {{ ttl?: number, max?: number, now?: () => number }} [options]
 *   ttl  lifetime of an entry in ms · max  entries kept (oldest dropped first) · now  clock
 */
export function createTtlCache({ ttl = CACHE_TTL_MS, max = 200, now = () => Date.now() } = {}) {
  const map = new Map() // key → { value, at }
  const expired = (entry, t) => t - entry.at >= ttl

  /** Drop every expired entry. */
  function sweep() {
    const t = now()
    for (const [key, entry] of map) if (expired(entry, t)) map.delete(key)
  }

  return {
    get(key) {
      const entry = map.get(key)
      if (!entry) return undefined
      if (expired(entry, now())) {
        map.delete(key)
        return undefined
      }
      return entry.value
    },
    has(key) {
      return this.get(key) !== undefined
    },
    set(key, value) {
      sweep()
      map.delete(key) // re-inserting moves it to the newest end
      map.set(key, { value, at: now() })
      while (map.size > max) map.delete(map.keys().next().value)
      return this
    },
    delete(key) {
      return map.delete(key)
    },
    clear() {
      map.clear()
    },
    sweep,
    get size() {
      sweep()
      return map.size
    },
  }
}

/**
 * Every cache made with `sharedCache()` is also swept once a minute in the browser, so memory is
 * freed even when nothing reads the cache again (e.g. the walker left the navigation screens).
 */
const registry = new Set()
let timer = null
export function sharedCache(options) {
  const cache = createTtlCache(options)
  registry.add(cache)
  if (!timer && typeof window !== 'undefined' && typeof setInterval === 'function') {
    timer = setInterval(() => registry.forEach((c) => c.sweep()), 60 * 1000)
  }
  return cache
}
