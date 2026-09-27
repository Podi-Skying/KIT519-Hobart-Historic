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
