/**
 * Three genuinely different walking routes for one trip:
 *   normal      Google's fastest walking route
 *   accessible  the candidate with the gentlest slopes / least climbing
 *   steep       the candidate with the most climbing (hill-top parks, river views)
 *
 * Google's WALK mode has no "flat" or "hilly" option, so candidates come from
 * (a) Google's own alternatives and (b) routes forced through low-lying
 * waterfront/rivulet via-points or hill-top via-points (data/navigation.js).
 * Each candidate's terrain is measured with the Open-Meteo elevation API.
 */
import { ROUTE_VIA_POINTS } from '@/data/navigation'
import { distanceKm } from '@/lib/geo'
import { fetchWalkingRoutes } from './routes'
import { routeProfile } from './elevation'

/** A via-point is only tried if it adds at most this much to the straight-line distance. */
const MAX_VIA_DETOUR = 1.6
/** …and isn't practically at the start or end (km). */
const MIN_VIA_GAP_KM = 0.15
const VIAS_PER_KIND = 2
/** Candidate routes may take at most this much longer than Normal. */
const MAX_SLOWDOWN = { accessible: 1.6, steep: 1.9 }

/** Naismith's rule: add one minute per 10 m of ascent to the flat walking time. */
export const routeMinutes = (route) =>
  Math.max(1, Math.round(route.durationSeconds / 60 + (route.climbMeters ?? 0) / 10))

/** Lower = easier. Steepest pinch dominates (it's what stops a wheelchair or pram), then total climb. */
export const difficultyScore = (route) => (route.maxGrade ?? 0) * 100 * 4 + (route.climbMeters ?? 0)

/**
 * Pick Normal / Accessible / Steep from profiled candidates (pure — unit-tested).
 * candidates[0] must be the fastest (Google's primary) route.
 */
export function chooseOptions(candidates) {
  const normal = candidates[0]
  const profiled = candidates.every((c) => c.climbMeters != null)
  if (!profiled) return { normal, accessible: normal, steep: normal }

  const within = (factor) => candidates.filter((c) => c.durationSeconds <= normal.durationSeconds * factor)
  const accessible = within(MAX_SLOWDOWN.accessible).reduce((best, c) => (difficultyScore(c) < difficultyScore(best) ? c : best), normal)
  // Steep = the hardest remaining option. Never the Accessible pick: if nothing is
  // harder than Normal, Steep equals Normal and the UI says so.
  const steep = within(MAX_SLOWDOWN.steep)
    .filter((c) => c !== accessible)
    .reduce((best, c) => (difficultyScore(c) > difficultyScore(best) ? c : best), normal)
  return { normal, accessible, steep }
}

/** Via-points worth trying between origin and destination, closest detour first. */
export function viaCandidates(origin, destination, kind) {
  const direct = Math.max(distanceKm(origin, destination), 0.05)
  return ROUTE_VIA_POINTS[kind]
    .map((v) => ({ ...v, kind, detour: (distanceKm(origin, v.coords) + distanceKm(v.coords, destination)) / direct }))
    .filter(
      (v) =>
        v.detour <= MAX_VIA_DETOUR &&
        distanceKm(v.coords, origin) > MIN_VIA_GAP_KM &&
        distanceKm(v.coords, destination) > MIN_VIA_GAP_KM,
    )
    .sort((a, b) => a.detour - b.detour)
    .slice(0, VIAS_PER_KIND)
}

const cache = new Map()
const keyOf = (points) => points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|')

/**
 * @param {{origin:{lat:number,lng:number}, destination:{lat:number,lng:number}, intermediates?:{lat:number,lng:number}[]}} trip
 * @returns {Promise<{normal: Object, accessible: Object, steep: Object}>} WalkingRoute + {climbMeters, maxGrade, via}
 */
export function planRouteOptions({ origin, destination, intermediates = [] }) {
  const key = keyOf([origin, ...intermediates, destination]) + `|${typeof document !== 'undefined' ? document.documentElement.lang : ''}`
  if (cache.has(key)) return cache.get(key)

  const job = (async () => {
    const base = await fetchWalkingRoutes({ origin, destination, intermediates, alternatives: true })
    const candidates = base.map((route) => ({ ...route, via: null }))

    const vias = [...viaCandidates(origin, destination, 'flat'), ...viaCandidates(origin, destination, 'scenic')]
    const viaRoutes = await Promise.allSettled(
      vias.map((v) =>
        fetchWalkingRoutes({ origin, destination, intermediates, via: [v.coords] }).then(([route]) => ({ ...route, via: v.name })),
      ),
    )
    for (const result of viaRoutes) {
      if (result.status === 'fulfilled' && !candidates.some((c) => c.encoded === result.value.encoded)) {
        candidates.push(result.value)
      }
    }

    // Terrain for every candidate; if the elevation service fails, all three fall back to Normal.
    await Promise.all(
      candidates.map(async (c) => {
        try {
          Object.assign(c, await routeProfile(c.path))
        } catch {
          c.climbMeters = null
          c.maxGrade = null
        }
      }),
    )
    return chooseOptions(candidates)
  })()

  cache.set(key, job)
  job.catch(() => cache.delete(key))
  return job
}
