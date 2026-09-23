/**
 * Turn-by-turn guidance from a WalkingRoute (see services/routes.js). Pure functions.
 */
import { distanceKm } from './geo'

/** Beyond this distance from every step the walker is considered off-route. */
const OFF_ROUTE_METERS = 80

const metersBetween = (a, b) => distanceKm(a, b) * 1000

/**
 * Metres from point P to segment AB. Uses a local equirectangular projection —
 * accurate to well under a metre at walking-route scales.
 */
export function metersToSegment(p, a, b) {
  const kx = 111320 * Math.cos((p.lat * Math.PI) / 180) // metres per degree of longitude here
  const ky = 110540 // metres per degree of latitude
  const [ax, ay] = [(a.lng - p.lng) * kx, (a.lat - p.lat) * ky]
  const [bx, by] = [(b.lng - p.lng) * kx, (b.lat - p.lat) * ky]
  const [dx, dy] = [bx - ax, by - ay]
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSq)) : 0
  return Math.hypot(ax + t * dx, ay + t * dy)
}

/** Metres from a point to a polyline. */
function metersToPath(point, path) {
  if (path.length === 1) return metersBetween(point, path[0])
  let best = Infinity
  for (let i = 1; i < path.length; i++) best = Math.min(best, metersToSegment(point, path[i - 1], path[i]))
  return best
}

/** Icon name for a Routes API maneuver. */
export function maneuverIcon(maneuver = '') {
  if (maneuver.includes('LEFT')) return 'turnLeft'
  if (maneuver.includes('RIGHT')) return 'turnRight'
  return 'up'
}

/**
 * The instruction the walker should act on next.
 * - No position (or off-route): the first step, as a "start here" instruction.
 * - On route: find the step being walked, and return the *next* manoeuvre with
 *   the distance remaining to it.
 * @param {{steps: {instruction:string, maneuver:string, distanceMeters:number, path:{lat:number,lng:number}[], end:{lat:number,lng:number}}[]}} route
 * @param {{lat:number,lng:number}|null} position
 * @returns {{instruction:string, maneuver:string, meters:number, stepIndex:number, arrived:boolean}}
 */
export function nextGuidance(route, position) {
  const steps = route?.steps ?? []
  if (!steps.length) return { instruction: 'Head to your destination', maneuver: 'STRAIGHT', meters: 0, stepIndex: -1, arrived: false }

  const start = { ...steps[0], meters: steps[0].distanceMeters, stepIndex: 0, arrived: false }
  if (!position) return pick(start)

  // Which step's geometry is the walker closest to? (ties go to the earlier step)
  let current = -1
  let best = Infinity
  steps.forEach((step, i) => {
    if (!step.path.length) return
    const d = metersToPath(position, step.path)
    if (d < best) {
      best = d
      current = i
    }
  })
  if (best > OFF_ROUTE_METERS) return pick(start)

  const toStepEnd = Math.round(metersBetween(position, steps[current].end))
  const upcoming = steps[current + 1]
  if (!upcoming) {
    return { instruction: 'Arrive at your destination', maneuver: 'STRAIGHT', meters: toStepEnd, stepIndex: current, arrived: toStepEnd < 20 }
  }
  return { instruction: upcoming.instruction, maneuver: upcoming.maneuver, meters: toStepEnd, stepIndex: current, arrived: false }
}

const pick = ({ instruction, maneuver, meters, stepIndex, arrived }) => ({ instruction, maneuver, meters, stepIndex, arrived })
