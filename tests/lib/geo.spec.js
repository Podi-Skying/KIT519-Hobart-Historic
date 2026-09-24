import { describe, expect, it } from 'vitest'
import { boundsOf, distanceKm, placeAlongPath, pointAlongPath, projectToBox, walkingMinutes } from '@/lib/geo'
import { HOBART_CENTRE } from '@/data/navigation'
import { SITES, getSiteById } from '@/data/sites'

describe('distanceKm', () => {
  it('is zero for the same point and symmetric', () => {
    const a = { lat: -42.88, lng: 147.33 }
    const b = { lat: -42.89, lng: 147.3 }
    expect(distanceKm(a, a)).toBe(0)
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 10)
  })

  it('matches a known distance (Franklin Square → Cascades Female Factory ≈ 2.8 km)', () => {
    expect(distanceKm(HOBART_CENTRE, getSiteById(1).coordinates)).toBeCloseTo(2.78, 1)
  })
})

describe('walkingMinutes', () => {
  it('applies walking speed and detour factor, minimum 1 minute', () => {
    expect(walkingMinutes(0)).toBe(1)
    expect(walkingMinutes(1)).toBe(16) // 1 km × 1.25 / 4.8 km/h
  })
})

describe('projectToBox', () => {
  const bounds = { south: -1, north: 1, west: -1, east: 1 }
  const box = { x: [0, 100], y: [0, 100] }
  it('maps corners and centre', () => {
    expect(projectToBox({ lat: 1, lng: -1 }, bounds, box)).toEqual({ x: 0, y: 0 })
    expect(projectToBox({ lat: 0, lng: 0 }, bounds, box)).toEqual({ x: 50, y: 50 })
  })
  it('returns null outside the bounds', () => {
    expect(projectToBox({ lat: 2, lng: 0 }, bounds, box)).toBeNull()
  })
})

describe('site data', () => {
  it('every site has real coordinates in Hobart, a fallback map position and AR images', () => {
    for (const site of SITES) {
      expect(distanceKm(HOBART_CENTRE, site.coordinates)).toBeLessThan(5)
      expect(site.mapPosition).not.toBeNull()
      expect(site.arImage).toMatch(/^https:/)
      expect(site.arApproachImage).toMatch(/^https:/)
    }
  })
  it('bounds contain every site', () => {
    const b = boundsOf(SITES.map((s) => s.coordinates))
    for (const { coordinates: c } of SITES) {
      expect(c.lat).toBeGreaterThanOrEqual(b.south)
      expect(c.lng).toBeLessThanOrEqual(b.east)
    }
  })
})

describe('pointAlongPath', () => {
  const path = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 1 },
    { lat: 0, lng: 3 },
  ]

  it('interpolates by distance, not by vertex count', () => {
    expect(pointAlongPath(path, 0)).toEqual({ lat: 0, lng: 0 })
    expect(pointAlongPath(path, 0.5).lng).toBeCloseTo(1.5, 6)
    expect(pointAlongPath(path, 1).lng).toBeCloseTo(3, 6)
  })

  it('clamps the fraction and handles short paths', () => {
    expect(pointAlongPath(path, 2).lng).toBeCloseTo(3, 6)
    expect(pointAlongPath([], 0.5)).toBeNull()
    expect(pointAlongPath([path[1]], 0.5)).toEqual(path[1])
  })
})

describe('placeAlongPath', () => {
  const path = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 1 },
  ]
  const stops = [{ id: 'toilets' }, { id: 'coffee' }, { id: 'library' }]

  it('puts every stop on the route, in order, without overlapping', () => {
    const placed = placeAlongPath(path, stops)
    const lngs = placed.map((p) => p.position.lng)
    expect(placed.map((p) => p.stop.id)).toEqual(['toilets', 'coffee', 'library'])
    placed.forEach((p) => expect(p.position.lat).toBe(0))
    expect(lngs[0]).toBeGreaterThan(0.1)
    expect(lngs[1]).toBeGreaterThan(lngs[0])
    expect(lngs[2]).toBeGreaterThan(lngs[1])
    expect(lngs[2]).toBeLessThan(0.9)
  })

  it('is stable across calls and empty without a route', () => {
    expect(placeAlongPath(path, stops)).toEqual(placeAlongPath(path, stops))
    expect(placeAlongPath([path[0]], stops)).toEqual([])
  })
})
