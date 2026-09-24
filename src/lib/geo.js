/**
 * Geographic helpers — pure functions, no browser APIs.
 * @typedef {{lat: number, lng: number}} LatLng
 */

const EARTH_RADIUS_KM = 6371
/** Average adult walking speed. */
export const WALKING_KMH = 4.8
/** Streets are rarely straight: scale crow-flies distance to an estimated walking distance. */
export const PATH_DETOUR_FACTOR = 1.25

const toRad = (deg) => (deg * Math.PI) / 180

/** Great-circle distance in km. */
export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/** Estimated walking minutes for a straight-line distance (never below 1). */
export function walkingMinutes(km) {
  return Math.max(1, Math.round(((km * PATH_DETOUR_FACTOR) / WALKING_KMH) * 60))
}

/** Round to one decimal place (for display). */
export const roundKm = (km) => Math.round(km * 10) / 10

/** Bounding box of a list of points, padded by a fraction of its size on each side. */
export function boundsOf(points, padding = 0.1) {
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const [south, north, west, east] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
  const padLat = (north - south) * padding
  const padLng = (east - west) * padding
  return { south: south - padLat, north: north + padLat, west: west - padLng, east: east + padLng }
}

/**
 * Project a coordinate into a percentage box on a flat canvas (used by the
 * illustrated fallback map). Returns null when the point lies outside `bounds`.
 * @param {LatLng} point
 * @param {{south:number,north:number,west:number,east:number}} bounds
 * @param {{x:[number,number], y:[number,number]}} box  percent ranges on the canvas
 */
export function projectToBox(point, bounds, box) {
  const tx = (point.lng - bounds.west) / (bounds.east - bounds.west)
  const ty = (bounds.north - point.lat) / (bounds.north - bounds.south)
  if (tx < 0 || tx > 1 || ty < 0 || ty > 1) return null
  return {
    x: box.x[0] + tx * (box.x[1] - box.x[0]),
    y: box.y[0] + ty * (box.y[1] - box.y[0]),
  }
}

/**
 * The point `fraction` (0–1) of the way along a path, measured by distance.
 * @param {LatLng[]} path
 */
export function pointAlongPath(path, fraction) {
  if (!path.length) return null
  if (path.length === 1) return path[0]
  const legs = path.slice(1).map((p, i) => distanceKm(path[i], p))
  let remaining = legs.reduce((sum, km) => sum + km, 0) * Math.min(1, Math.max(0, fraction))
  for (let i = 0; i < legs.length; i++) {
    if (remaining <= legs[i] || i === legs.length - 1) {
      const t = legs[i] ? Math.min(1, remaining / legs[i]) : 0
      const [a, b] = [path[i], path[i + 1]]
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
    }
    remaining -= legs[i]
  }
  return path[path.length - 1]
}

/** Stable 0–1 pseudo-random number from a string (same input → same value). */
function seeded(text) {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return (h >>> 0) / 4294967295
}

/**
 * Prototype placement for amenity stops (toilets, coffee…), which have no real
 * location: spread them evenly along the route with a small seeded jitter, so each
 * one sits on the line, keeps its spot between renders and never stacks on another.
 * @param {LatLng[]} path
 * @param {{id: string}[]} stops
 * @returns {{stop: object, position: LatLng}[]}
 */
export function placeAlongPath(path, stops) {
  if (path.length < 2) return []
  return stops.map((stop, i) => {
    const slot = (i + 1) / (stops.length + 1)
    const jitter = (seeded(stop.id) - 0.5) * (0.5 / (stops.length + 1))
    return { stop, position: pointAlongPath(path, slot + jitter) }
  })
}
