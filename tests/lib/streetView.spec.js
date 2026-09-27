import { describe, expect, it } from 'vitest'
import { LANDMARK_PITCH, angleBetween, approachAngle, bearing, bestLink, facingPov, offsetPoint, orientationToPov, pointAhead } from '@/lib/streetView'
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

describe('orientationToPov (turn the phone to look around)', () => {
  it('uses the iPhone compass heading and turns upright = level', () => {
    expect(orientationToPov({ alpha: 10, beta: 90, webkitCompassHeading: 45 })).toEqual({ heading: 45, pitch: 0 })
    expect(orientationToPov({ alpha: 10, beta: 120, webkitCompassHeading: 45 }).pitch).toBe(30) // top tilted back: look up
  })
  it('converts an absolute alpha (counter-clockwise) to a compass heading', () => {
    expect(orientationToPov({ alpha: 90, beta: 90, absolute: true }).heading).toBe(270)
    expect(orientationToPov({ alpha: 0, beta: 90, absolute: true }).heading).toBe(0)
  })
  it('corrects for a rotated screen', () => {
    expect(orientationToPov({ alpha: 0, beta: 90, absolute: true }, { screenAngle: 90 }).heading).toBe(90)
  })
  it('without a compass, turns relative to where the view started', () => {
    const pov = orientationToPov({ alpha: 30, beta: 90 }, { relativeTo: { alpha: 50, heading: 100 } })
    expect(pov.heading).toBe(120) // phone turned 20° clockwise (alpha down 20)
    expect(orientationToPov({ alpha: 30, beta: 90 })).toBeNull()
    expect(orientationToPov({ alpha: 30, beta: null, absolute: true })).toBeNull()
  })
})

describe('approachAngle', () => {
  it('takes the short way round the circle', () => {
    expect(approachAngle(359, 1, 0.5)).toBeCloseTo(0)
    expect(approachAngle(10, 350, 1)).toBeCloseTo(350)
    expect(approachAngle(90, 180, 0.5)).toBeCloseTo(135)
  })
})

describe('offsetPoint', () => {
  it('moves the map centre ahead of the walker along the heading', () => {
    const p = { lat: -42.89, lng: 147.33 }
    const north = offsetPoint(p, 0, 111.32)
    expect(north.lat).toBeCloseTo(-42.889, 5)
    expect(north.lng).toBeCloseTo(147.33, 6)
    const east = offsetPoint(p, 90, 100)
    expect(bearing(p, east)).toBeCloseTo(90, 0)
  })
})

describe('bestLink (walk forward through Street View)', () => {
  const links = [
    { heading: 10, pano: 'north' },
    { heading: 185, pano: 'south' },
    { heading: 95, pano: 'east' },
  ]
  it('picks the neighbour closest to the route direction, across 0°/360°', () => {
    expect(bestLink(links, 350).pano).toBe('north')
    expect(bestLink(links, 120).pano).toBe('east')
  })
  it('refuses to turn into a side street', () => {
    expect(bestLink(links, 270)).toBeNull()
    expect(bestLink([], 0)).toBeNull()
  })
  it('measures angles the short way round', () => {
    expect(angleBetween(350, 10)).toBe(20)
    expect(angleBetween(90, 270)).toBe(180)
  })
})
