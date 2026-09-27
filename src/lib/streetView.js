/**
 * Geometry for the AR page's 360° Street View (components/ar/StreetView360.vue).
 * Pure functions, so the "open facing the building" rule is unit-tested without Google.
 */

const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

/**
 * Initial compass bearing from `from` to `to`, in degrees clockwise from north (0 ≤ b < 360).
 * Same result as google.maps.geometry.spherical.computeHeading, without loading that library.
 * @param {{ lat: number, lng: number }} from
 * @param {{ lat: number, lng: number }} to
 */
export function bearing(from, to) {
  const φ1 = toRad(from.lat)
  const φ2 = toRad(to.lat)
  const Δλ = toRad(to.lng - from.lng)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Look slightly up: a landmark seen from the footpath is taller than eye level. */
export const LANDMARK_PITCH = 10

/**
 * Street View camera (point of view) for a panorama taken at `panoAt`, turned to face `target`.
 * @returns {{ heading: number, pitch: number }}
 */
export function facingPov(panoAt, target, pitch = LANDMARK_PITCH) {
  return { heading: Math.round(bearing(panoAt, target) * 10) / 10, pitch }
}

/** How far from the landmark we look for a panorama (metres). Street View's own nearest search. */
export const PANO_SEARCH_RADIUS_M = 60

/** Walking with 360° on: look for a newer panorama after moving this far (metres). */
export const PANO_FOLLOW_METERS = 25

/** How far ahead on the route the navigation view looks (metres). */
export const LOOK_AHEAD_M = 40

const metersBetween = (a, b) => {
  const R = 6371000
  const dφ = toRad(b.lat - a.lat)
  const dλ = toRad(b.lng - a.lng)
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dλ / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * The point `ahead` metres further along `path` from where the walker is (their nearest vertex),
 * so AR navigation's 360° view faces the way to walk. Short paths → the last point.
 * @param {{lat:number,lng:number}[]} path
 * @param {{lat:number,lng:number}} position
 */
export function pointAhead(path, position, ahead = LOOK_AHEAD_M) {
  if (!path?.length) return null
  let start = 0
  let best = Infinity
  path.forEach((p, i) => {
    const d = metersBetween(position, p)
    if (d < best) {
      best = d
      start = i
    }
  })
  let left = ahead
  for (let i = start + 1; i < path.length; i++) {
    const step = metersBetween(path[i - 1], path[i])
    if (step >= left) {
      const f = left / step
      return {
        lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * f,
        lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * f,
      }
    }
    left -= step
  }
  return path[path.length - 1]
}
