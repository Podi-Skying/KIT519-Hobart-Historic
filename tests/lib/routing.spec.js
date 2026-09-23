import { describe, expect, it } from 'vitest'
import { decodePolyline } from '@/lib/polyline'
import { maneuverIcon, nextGuidance } from '@/lib/guidance'
import { formatMeters } from '@/lib/format'
import { parseRoute } from '@/services/routes'

describe('decodePolyline', () => {
  it("decodes Google's documented example", () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ])
  })
  it('returns an empty list for an empty string', () => {
    expect(decodePolyline('')).toEqual([])
  })
})

// Two-step route heading east along a street, then north.
const route = {
  steps: [
    {
      instruction: 'Head east on Davey St',
      maneuver: 'DEPART',
      distanceMeters: 160,
      path: [{ lat: -42.884, lng: 147.328 }, { lat: -42.884, lng: 147.33 }],
      end: { lat: -42.884, lng: 147.33 },
    },
    {
      instruction: 'Turn left onto Murray St',
      maneuver: 'TURN_LEFT',
      distanceMeters: 110,
      path: [{ lat: -42.884, lng: 147.33 }, { lat: -42.883, lng: 147.33 }],
      end: { lat: -42.883, lng: 147.33 },
    },
  ],
}

describe('nextGuidance', () => {
  it('without a position, starts with the first step', () => {
    expect(nextGuidance(route, null)).toMatchObject({ instruction: 'Head east on Davey St', meters: 160, stepIndex: 0 })
  })
  it('on the first step, announces the upcoming turn and distance to it', () => {
    const g = nextGuidance(route, { lat: -42.884, lng: 147.329 })
    expect(g.instruction).toBe('Turn left onto Murray St')
    expect(g.maneuver).toBe('TURN_LEFT')
    expect(g.meters).toBeGreaterThan(70)
    expect(g.meters).toBeLessThan(90)
  })
  it('on the last step, announces arrival', () => {
    const g = nextGuidance(route, { lat: -42.88301, lng: 147.33 })
    expect(g.instruction).toBe('Arrive at your destination')
    expect(g.arrived).toBe(true)
  })
  it('far off-route falls back to the first step', () => {
    expect(nextGuidance(route, { lat: -42.9, lng: 147.2 }).stepIndex).toBe(0)
  })
  it('handles a missing route', () => {
    expect(nextGuidance(null, null).stepIndex).toBe(-1)
  })
})

describe('maneuverIcon / formatMeters', () => {
  it('maps manoeuvres to icons', () => {
    expect(maneuverIcon('TURN_SHARP_LEFT')).toBe('turnLeft')
    expect(maneuverIcon('TURN_SLIGHT_RIGHT')).toBe('turnRight')
    expect(maneuverIcon('STRAIGHT')).toBe('up')
  })
  it('rounds walking distances', () => {
    expect(formatMeters(118)).toBe('120 m')
    expect(formatMeters(3)).toBe('10 m')
    expect(formatMeters(1530)).toBe('1.5 km')
  })
})

describe('parseRoute', () => {
  it('converts a Routes API response', () => {
    const parsed = parseRoute({
      distanceMeters: 270,
      duration: '240s',
      polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' },
      legs: [
        {
          steps: [
            {
              distanceMeters: 270,
              polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' },
              endLocation: { latLng: { latitude: 40.7, longitude: -120.95 } },
              navigationInstruction: { maneuver: 'TURN_LEFT', instructions: 'Turn left' },
            },
          ],
        },
      ],
    })
    expect(parsed.durationSeconds).toBe(240)
    expect(parsed.path).toHaveLength(2)
    expect(parsed.steps[0]).toMatchObject({ instruction: 'Turn left', maneuver: 'TURN_LEFT', end: { lat: 40.7, lng: -120.95 } })
  })
})

describe('metersToSegment', () => {
  it('measures perpendicular distance to the middle of a segment', async () => {
    const { metersToSegment } = await import('@/lib/guidance')
    const a = { lat: -42.884, lng: 147.328 }
    const b = { lat: -42.884, lng: 147.33 }
    expect(metersToSegment({ lat: -42.884, lng: 147.329 }, a, b)).toBeLessThan(0.5)
    expect(metersToSegment({ lat: -42.8831, lng: 147.329 }, a, b)).toBeCloseTo(99.5, 0)
  })
})
