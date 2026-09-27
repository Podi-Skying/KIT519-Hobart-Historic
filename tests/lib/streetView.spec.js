import { describe, expect, it } from 'vitest'
import { LANDMARK_PITCH, bearing, facingPov } from '@/lib/streetView'
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
