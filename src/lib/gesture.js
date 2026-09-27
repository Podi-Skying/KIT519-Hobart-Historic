/**
 * Gesture physics shared by sheets, the gallery and "Through time" (Apple, Designing Fluid
 * Interfaces, WWDC 2018). Pure functions — unit-tested in tests/lib/gesture.spec.js.
 */

/**
 * Distance (px) a flick will travel before it comes to rest — Apple's projection
 * (exponential decay, like scroll deceleration), not the textbook v²/2a.
 * @param {number} velocity px/ms (signed)
 * @param {number} decelerationRate 0.998 ≈ scroll feel; 0.99 = snappier (sheets, pagers)
 */
export function project(velocity, decelerationRate = 0.99) {
  return (velocity * decelerationRate) / (1 - decelerationRate)
}

/**
 * Soft boundary: the further past the edge, the less the element follows.
 * @param {number} overshoot px past the boundary (signed)
 * @param {number} dimension size of the element along the axis (px)
 */
export function rubberband(overshoot, dimension, constant = 0.55) {
  const sign = Math.sign(overshoot)
  const x = Math.abs(overshoot)
  return (sign * (x * dimension * constant)) / (dimension + constant * x)
}

/**
 * Velocity from the recent pointer history, not the average since the press
 * (a long hold followed by a quick flick must still count as a flick).
 */
export function createVelocityTracker({ window = 100, minSpan = 16 } = {}) {
  let samples = []
  return {
    reset(t, v) {
      samples = [{ t, v }]
    },
    add(t, v) {
      samples.push({ t, v })
      if (samples.length > 20) samples.shift()
    },
    /** px/ms over the last `window` ms (reaching further back if that span is too short to measure). */
    velocity() {
      if (samples.length < 2) return 0
      const last = samples[samples.length - 1]
      let i = samples.length - 1
      while (i > 0 && last.t - samples[i - 1].t <= window) i--
      while (i > 0 && last.t - samples[i].t < minSpan) i--
      const first = samples[i]
      const dt = last.t - first.t
      return dt > 0 ? (last.v - first.v) / dt : 0
    },
  }
}

/**
 * Velocity hand-off for a CSS transition: a cubic-bezier whose starting slope matches the
 * finger's speed, so there is no seam between dragging and animating. At rest it eases in
 * gently (like a critically damped spring released from rest); it never overshoots.
 * @param {number} velocity px/ms towards the target (negative = moving away, treated as 0)
 * @param {number} distance px still to travel
 * @param {number} duration ms of the transition
 */
export function releaseEasing(velocity, distance, duration) {
  const x1 = 0.25
  const d = Math.abs(distance)
  const slope = d > 0.5 && velocity > 0 ? (velocity * duration) / d : 0
  const y1 = Math.min(1, slope * x1)
  return `cubic-bezier(${x1}, ${round(y1)}, 0.3, 1)`
}

const round = (n) => Math.round(n * 1000) / 1000

/**
 * Photo pager: where a release should land. Uses the momentum projection, not the release
 * point, so a short quick flick still turns the page and a long slow drag that is let go
 * short of halfway does not.
 * @param {number} offset px the photo is dragged (negative = towards the next photo)
 * @param {number} velocity px/ms at release
 * @param {number} width px of one page
 * @returns {-1 | 0 | 1} page step: 1 = next, -1 = previous, 0 = settle back
 */
export function pagerStep(offset, velocity, width) {
  const projected = offset + project(velocity)
  if (Math.abs(projected) <= width / 2) return 0
  return projected < 0 ? 1 : -1
}
