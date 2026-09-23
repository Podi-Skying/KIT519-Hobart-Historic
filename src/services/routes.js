/**
 * Walking directions from the Google Routes API (computeRoutes, travelMode WALK).
 * Uses the same browser key as Maps JS — the key's project must have the
 * **Routes API** enabled (and allowed in the key's API restrictions).
 *
 * @typedef {{lat:number,lng:number}} LatLng
 * @typedef {Object} RouteStep
 * @property {string} instruction   e.g. "Turn left onto Davey St"
 * @property {string} maneuver      Routes API maneuver, e.g. "TURN_LEFT"
 * @property {number} distanceMeters
 * @property {LatLng[]} path
 * @property {LatLng} end
 * @typedef {Object} WalkingRoute
 * @property {number} distanceMeters
 * @property {number} durationSeconds
 * @property {string} encoded   Google encoded polyline (used to de-duplicate candidates)
 * @property {LatLng[]} path
 * @property {RouteStep[]} steps
 */
import { decodePolyline } from '@/lib/polyline'
import { i18n, localeInfo } from '@/i18n'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const FIELD_MASK = [
  'routes.distanceMeters',
  'routes.duration',
  'routes.polyline.encodedPolyline',
  'routes.legs.steps.distanceMeters',
  'routes.legs.steps.polyline.encodedPolyline',
  'routes.legs.steps.endLocation',
  'routes.legs.steps.navigationInstruction',
].join(',')

export const isRoutingConfigured = () => API_KEY.trim().length > 0

/** In-memory cache so re-renders and back-navigation don't re-bill the same request. */
const cache = new Map()
const round = (n) => n.toFixed(4) // ~10 m — small GPS jitter reuses the cached route
const cacheKey = (points) => points.map((p) => `${round(p.lat)},${round(p.lng)}`).join('|')

const waypoint = ({ lat, lng }, via = false) => ({
  location: { latLng: { latitude: lat, longitude: lng } },
  ...(via ? { via: true } : {}),
})

/**
 * Walking routes from the Routes API.
 * @param {Object} request
 * @param {LatLng} request.origin
 * @param {LatLng} request.destination
 * @param {LatLng[]} [request.intermediates]  stops the walker visits
 * @param {LatLng[]} [request.via]            pass-through points that only shape the route
 * @param {boolean} [request.alternatives]    ask for alternative routes (ignored with waypoints — API limitation)
 * @returns {Promise<WalkingRoute[]>} best route first
 */
export async function fetchWalkingRoutes({ origin, destination, intermediates = [], via = [], alternatives = false }) {
  if (!isRoutingConfigured()) throw new Error('Routing is not configured')
  const waypoints = [...intermediates.map((p) => waypoint(p)), ...via.map((p) => waypoint(p, true))]
  const wantAlternatives = alternatives && waypoints.length === 0

  const language = routesLanguage()
  const key = `${cacheKey([origin, ...intermediates, ...via, destination])}|v${via.length}|a${wantAlternatives ? 1 : 0}|${language}`
  if (cache.has(key)) return cache.get(key)

  const request = (async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        origin: waypoint(origin),
        destination: waypoint(destination),
        intermediates: waypoints,
        travelMode: 'WALK',
        computeAlternativeRoutes: wantAlternatives,
        languageCode: language,
        units: 'METRIC',
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error?.message ?? `Routes API ${response.status}`)
    if (!data.routes?.length) throw new Error('No walking route found')
    return data.routes.map(parseRoute)
  })()

  cache.set(key, request)
  request.catch(() => cache.delete(key)) // don't cache failures
  return request
}

/** Single best walking route (convenience wrapper). */
export async function fetchWalkingRoute(request) {
  return (await fetchWalkingRoutes(request))[0]
}

/** Turn-by-turn instructions follow the app language, as a region-specific tag Google supports (e.g. zh-TW). */
const routesLanguage = () => localeInfo(i18n.global.locale.value).speech[0]

/** Convert a Routes API route object into the app's WalkingRoute shape. */
export function parseRoute(route) {
  const steps = (route.legs ?? []).flatMap((leg) =>
    (leg.steps ?? []).map((step) => {
      const path = decodePolyline(step.polyline?.encodedPolyline ?? '')
      const endLatLng = step.endLocation?.latLng
      return {
        instruction: step.navigationInstruction?.instructions ?? 'Continue',
        maneuver: step.navigationInstruction?.maneuver ?? 'STRAIGHT',
        distanceMeters: step.distanceMeters ?? 0,
        path,
        end: endLatLng ? { lat: endLatLng.latitude, lng: endLatLng.longitude } : path[path.length - 1],
      }
    }),
  )
  return {
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds: Number.parseInt(route.duration ?? '0', 10),
    encoded: route.polyline?.encodedPolyline ?? '',
    path: decodePolyline(route.polyline?.encodedPolyline ?? ''),
    steps,
  }
}
