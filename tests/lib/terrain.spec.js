import { describe, expect, it } from 'vitest'
import { elevationProfile, samplePath } from '@/services/elevation'
import { chooseOptions, difficultyScore, routeMinutes, viaCandidates } from '@/services/routeOptions'
import { distanceKm } from '@/lib/geo'
import { DEFAULT_ORIGIN } from '@/data/navigation'
import { getSiteById } from '@/data/sites'

describe('samplePath', () => {
  const path = [{ lat: -42.88, lng: 147.33 }, { lat: -42.89, lng: 147.33 }] // ~1.1 km
  it('keeps both ends and spaces samples evenly', () => {
    const samples = samplePath(path, 100, 80)
    expect(samples[0]).toEqual(path[0])
    expect(samples.at(-1)).toEqual(path[1])
    const gap = distanceKm(samples[1], samples[2]) * 1000
    expect(gap).toBeGreaterThan(95)
    expect(gap).toBeLessThan(105)
  })
  it('never exceeds the sample budget', () => {
    expect(samplePath(path, 1, 20).length).toBeLessThanOrEqual(21)
  })
})

describe('elevationProfile', () => {
  const points = [0, 1, 2, 3].map((i) => ({ lat: -42.88 - i * 0.001, lng: 147.33 })) // ~111 m apart
  it('sums climb and descent separately', () => {
    const p = elevationProfile(points, [10, 20, 15, 30])
    expect(p.climbMeters).toBe(25)
    expect(p.descentMeters).toBe(5)
  })
  it('measures the steepest stretch as a fraction', () => {
    const p = elevationProfile(points, [0, 11.1, 11.1, 11.1], 80)
    expect(p.maxGrade).toBeCloseTo(0.1, 2)
  })
})

describe('chooseOptions', () => {
  const route = (name, minutes, climb, grade) => ({ name, durationSeconds: minutes * 60, climbMeters: climb, maxGrade: grade })
  const fastest = route('fastest', 10, 30, 0.1)
  const flat = route('flat', 13, 5, 0.03)
  const hilly = route('hilly', 16, 60, 0.14)
  const tooSlow = route('too slow', 40, 0, 0)

  it('Normal = fastest, Accessible = gentlest, Steep = most climbing', () => {
    const o = chooseOptions([fastest, flat, hilly, tooSlow])
    expect(o.normal.name).toBe('fastest')
    expect(o.accessible.name).toBe('flat')
    expect(o.steep.name).toBe('hilly')
  })
  it('ignores candidates that take far longer than Normal', () => {
    expect(chooseOptions([fastest, tooSlow]).accessible.name).toBe('fastest')
  })
  it('falls back to Normal for all three when terrain is unknown', () => {
    const o = chooseOptions([fastest, { ...flat, climbMeters: null, maxGrade: null }])
    expect(o.accessible).toBe(fastest)
    expect(o.steep).toBe(fastest)
  })
  it('scores steep pinches above gentle climbs and adds climbing time', () => {
    expect(difficultyScore(route('a', 1, 10, 0.12))).toBeGreaterThan(difficultyScore(route('b', 1, 30, 0.03)))
    expect(routeMinutes(route('c', 10, 40, 0))).toBe(14) // Naismith: +1 min per 10 m
  })
})

describe('viaCandidates', () => {
  it('only suggests via-points that are a reasonable detour', () => {
    const origin = DEFAULT_ORIGIN
    const destination = getSiteById(3).coordinates // Salamanca
    const direct = distanceKm(origin, destination)
    for (const kind of ['flat', 'scenic']) {
      for (const v of viaCandidates(origin, destination, kind)) {
        expect(distanceKm(origin, v.coords) + distanceKm(v.coords, destination)).toBeLessThanOrEqual(direct * 1.6 + 1e-9)
      }
    }
  })
})
