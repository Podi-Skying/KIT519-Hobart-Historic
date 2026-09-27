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

/**
 * Street View heading/pitch from a device-orientation event, for "turn the phone to look
 * around". The app does this itself instead of Google's `motionTracking`: Google's tracking
 * only starts after its *own* permission prompt (from its own control, which the app hides),
 * so with the app's toggle it never moved on iPhones.
 *
 * - heading: real compass heading when the device gives one — iOS `webkitCompassHeading`
 *   (clockwise from north) or an absolute `alpha` (counter-clockwise from north) — corrected
 *   for screen rotation. Without an absolute reading, `relativeTo` ({alpha, heading}) turns the
 *   change in alpha into a change of the heading the view had when tracking started.
 * - pitch: phone held upright (beta ≈ 90°) looks level; tilting the top back looks up.
 *
 * @param {{alpha:number|null, beta:number|null, gamma?:number|null, absolute?:boolean, webkitCompassHeading?:number}} e
 * @param {{ screenAngle?: number, relativeTo?: {alpha:number, heading:number} }} [options]
 * @returns {{heading:number, pitch:number} | null}  null = not enough data
 */
export function orientationToPov(e, { screenAngle = 0, relativeTo } = {}) {
  if (e.beta == null) return null
  const pitch = Math.max(-80, Math.min(80, e.beta - 90))
  let heading
  if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
    heading = e.webkitCompassHeading + screenAngle
  } else if (e.alpha != null && e.absolute) {
    heading = 360 - e.alpha + screenAngle
  } else if (e.alpha != null && relativeTo) {
    heading = relativeTo.heading + (relativeTo.alpha - e.alpha)
  } else {
    return null
  }
  return { heading: ((heading % 360) + 360) % 360, pitch }
}

/**
 * Move `from` a fraction of the way to `to` on a circle (degrees), taking the short way round
 * (359° → 1° is +2°, not −358°). Low-pass filter for jittery compass readings.
 */
export function approachAngle(from, to, fraction) {
  const delta = ((((to - from) % 360) + 540) % 360) - 180
  return (((from + delta * fraction) % 360) + 360) % 360
}
