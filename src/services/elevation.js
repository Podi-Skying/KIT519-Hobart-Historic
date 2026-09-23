/**
 * Terrain elevation from Open-Meteo (https://open-meteo.com/en/docs/elevation-api):
 * free, no API key, CORS-enabled, ~90 m Copernicus DEM. Used to tell flat routes
 * from hilly ones. Free for non-commercial use — fine for this prototype.
 */
import { distanceKm } from '@/lib/geo'

const ENDPOINT = 'https://api.open-meteo.com/v1/elevation'
const MAX_PER_REQUEST = 100
/** Spacing between elevation samples along a route (the DEM resolution is ~90 m). */
const SAMPLE_SPACING_M = 45
const MAX_SAMPLES = 80

const cache = new Map()
const keyOf = (p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`

/** Elevation (m) for each point, batching requests and caching repeats. */
export async function fetchElevations(points) {
  const missing = [...new Set(points.map(keyOf))].filter((k) => !cache.has(k))
  for (let i = 0; i < missing.length; i += MAX_PER_REQUEST) {
    const batch = missing.slice(i, i + MAX_PER_REQUEST)
    const params = new URLSearchParams({
      latitude: batch.map((k) => k.split(',')[0]).join(','),
      longitude: batch.map((k) => k.split(',')[1]).join(','),
    })
    const response = await fetch(`${ENDPOINT}?${params}`)
    if (!response.ok) throw new Error(`Elevation API ${response.status}`)
    const { elevation } = await response.json()
    batch.forEach((k, j) => cache.set(k, elevation[j]))
  }
  return points.map((p) => cache.get(keyOf(p)))
}

/**
 * Evenly spaced points along a path (by distance), always including both ends.
 * @param {{lat:number,lng:number}[]} path
 */
export function samplePath(path, spacingM = SAMPLE_SPACING_M, maxSamples = MAX_SAMPLES) {
  if (path.length < 2) return [...path]
  const total = path.slice(1).reduce((sum, p, i) => sum + distanceKm(path[i], p) * 1000, 0)
  const step = Math.max(spacingM, total / (maxSamples - 1))
  const samples = [path[0]]
  let nextAt = step
  let walked = 0
  for (let i = 1; i < path.length; i++) {
    const segment = distanceKm(path[i - 1], path[i]) * 1000
    while (segment > 0 && walked + segment >= nextAt) {
      const t = (nextAt - walked) / segment
      samples.push({
        lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * t,
        lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * t,
      })
      nextAt += step
    }
    walked += segment
  }
  samples.push(path[path.length - 1])
  return samples
}

/**
 * Climb and steepness of a series of (point, elevation) samples.
 * Grades are measured over stretches of at least `minRunM` to smooth DEM noise.
 * @returns {{climbMeters:number, descentMeters:number, maxGrade:number}}  maxGrade as a fraction (0.08 = 8 %)
 */
export function elevationProfile(points, elevations, minRunM = 80) {
  let climb = 0
  let descent = 0
  let maxGrade = 0
  let anchor = 0
  let run = 0
  for (let i = 1; i < points.length; i++) {
    const dh = elevations[i] - elevations[i - 1]
    if (dh > 0) climb += dh
    else descent -= dh
    run += distanceKm(points[i - 1], points[i]) * 1000
    if (run >= minRunM) {
      maxGrade = Math.max(maxGrade, Math.abs(elevations[i] - elevations[anchor]) / run)
      anchor = i
      run = 0
    }
  }
  return { climbMeters: Math.round(climb), descentMeters: Math.round(descent), maxGrade: Math.round(maxGrade * 1000) / 1000 }
}

/** Fetch terrain along a route path and summarise it. */
export async function routeProfile(path) {
  const samples = samplePath(path)
  const elevations = await fetchElevations(samples)
  return elevationProfile(samples, elevations)
}
