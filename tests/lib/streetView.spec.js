import { describe, expect, it } from 'vitest'
import { LANDMARK_PITCH, bearing, facingPov, pointAhead } from '@/lib/streetView'
import { getSiteById } from '@/data/sites'

describe('bearing', () => {
  const o = { lat: -42.89, lng: 147.33 }
  it('points to the four compass directions', () => {
    expect(bearing(o, { lat: -42.88, lng: 147.33 })).toBeCloseTo(0, 5) // north
    expect(bearing(o, { lat: -42.89, lng: 147.34 })).toBeCloseTo(90, 1) // east
    expect(bearing(o, { lat: -42.9, lng: 147.33 })).toBeCloseTo(180, 5) // south
    expect(bearing(o, { lat: -42.89, lng: 147.32 })).toBeCloseTo(270, 1) // west
  })
  it('always returns 0 ≤ b < 360', () => {
    const b = bearing(o, { lat: -42.891, lng: 147.329 })
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThan(360)
    expect(b).toBeGreaterThan(180) // south-west
  })
})

describe('facingPov', () => {
  it("turns a panorama on the street to face St George's Church", () => {
    const church = getSiteById(2).coordinates
    // a panorama 30 m west of the church looks east, slightly up
    const pov = facingPov({ lat: church.lat, lng: church.lng - 0.00037 }, church)
    expect(pov.heading).toBeCloseTo(90, 0)
    expect(pov.pitch).toBe(LANDMARK_PITCH)
  })
})

describe('pointAhead', () => {
  // a straight street running east: 0.001° lng ≈ 81.6 m at this latitude
  const path = [
    { lat: -42.89, lng: 147.33 },
    { lat: -42.89, lng: 147.331 },
    { lat: -42.89, lng: 147.332 },
  ]
  it('returns the point ~40 m further along from the walker', () => {
    const p = pointAhead(path, { lat: -42.8901, lng: 147.33 }, 40)
    expect(p.lat).toBeCloseTo(-42.89, 6)
    expect(p.lng).toBeGreaterThan(147.3304)
    expect(p.lng).toBeLessThan(147.3306)
  })
  it('crosses vertices and stops at the end of the route', () => {
    expect(pointAhead(path, path[1], 1000)).toEqual(path[2])
    expect(pointAhead([], path[0])).toBeNull()
  })
  it('faces east from the start of the street', () => {
    expect(bearing(path[0], pointAhead(path, path[0]))).toBeCloseTo(90, 0)
  })
})
