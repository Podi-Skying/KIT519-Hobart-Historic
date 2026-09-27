/**
 * Damped spring in Apple's two designer parameters (Designing Fluid Interfaces, WWDC 2018):
 *   dampingRatio  1 = critically damped (no overshoot) · < 1 = bounces (0.8 after a flick)
 *   response      seconds for the spring to (mostly) get there — not a duration
 * Exact analytic step, so it is frame-rate independent and interruptible: to redirect,
 * just keep the current { value, velocity } and give it a new target.
 * Units: value in px, velocity in px/s, dt in s. Pure — unit-tested in tests/lib/spring.spec.js.
 */

/** Apple's presets. */
export const SPRINGS = Object.freeze({
  default: { dampingRatio: 1, response: 0.4 }, // move / reposition
  sheet: { dampingRatio: 1, response: 0.3 }, // drawer settling after a slow release
  flick: { dampingRatio: 0.8, response: 0.3 }, // drawer after a flick: momentum earns a little bounce
  page: { dampingRatio: 1, response: 0.42 }, // page push / pop, photo pager: large travel, no bounce
})

/**
 * Advance a spring by dt seconds.
 * @param {{ value: number, velocity: number }} state
 * @param {number} target
 * @param {{ dampingRatio: number, response: number }} params
 * @param {number} dt seconds
 * @returns {{ value: number, velocity: number }}
 */
export function stepSpring({ value, velocity }, target, { dampingRatio, response }, dt) {
  const w0 = (2 * Math.PI) / response
  const zeta = Math.max(0.01, dampingRatio)
  const x0 = value - target
  const v0 = velocity
  if (zeta >= 1) {
    // Critically damped (over-damped params are treated as critical: Apple never ships them)
    const e = Math.exp(-w0 * dt)
    const c = v0 + w0 * x0
    return { value: target + (x0 + c * dt) * e, velocity: (v0 - w0 * dt * c) * e }
  }
  const alpha = zeta * w0
  const wd = w0 * Math.sqrt(1 - zeta * zeta)
  const e = Math.exp(-alpha * dt)
  const B = (v0 + alpha * x0) / wd
  const cos = Math.cos(wd * dt)
  const sin = Math.sin(wd * dt)
  return {
    value: target + e * (x0 * cos + B * sin),
    velocity: e * (v0 * cos - (alpha * B + x0 * wd) * sin),
  }
}

/** Close enough to stop animating (sub-pixel, nearly still). */
export function isSettled({ value, velocity }, target, epsilon = 0.5) {
  return Math.abs(value - target) < epsilon && Math.abs(velocity) < epsilon * 20
}

/**
 * Drive a spring on the display clock (requestAnimationFrame; setTimeout where there is none,
 * e.g. unit tests with fake timers). Returns a controller; `retarget` keeps the live velocity.
 * @param {(value: number) => void} onFrame
 * @param {{ epsilon?: number }} [options] "at rest" threshold in the value's own units
 *   (0.5 for px; use a much smaller one for fractions, e.g. page widths)
 */
export function createSpringAnimator(onFrame, { epsilon = 0.5 } = {}) {
  let state = { value: 0, velocity: 0 }
  let target = 0
  let params = SPRINGS.default
  let handle = null
  let last = 0
  let onRest = null
  const raf = typeof requestAnimationFrame === 'function'
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
  const schedule = (fn) => (raf ? requestAnimationFrame(fn) : setTimeout(fn, 16))
  const cancel = (h) => (raf ? cancelAnimationFrame(h) : clearTimeout(h))

  function frame() {
    const t = now()
    // clamp dt: a backgrounded tab must not teleport the spring
    const dt = Math.min(0.064, Math.max(0.001, (t - last) / 1000))
    last = t
    state = stepSpring(state, target, params, dt)
    if (isSettled(state, target, epsilon)) {
      state = { value: target, velocity: 0 }
      handle = null
      onFrame(target)
      const done = onRest
      onRest = null
      done?.()
      return
    }
    onFrame(state.value)
    handle = schedule(frame)
  }

  return {
    /** Start (or redirect) towards `to` from `from` at `velocity` px/s. */
    animate({ from, to, velocity = 0, spring = SPRINGS.default, done = null }) {
      if (handle !== null) cancel(handle)
      state = { value: from, velocity }
      target = to
      params = spring
      onRest = done
      last = now()
      handle = schedule(frame)
    },
    /** Stop where it is (a finger caught it). Returns the live value. */
    stop() {
      if (handle !== null) cancel(handle)
      handle = null
      onRest = null
      return state.value
    },
    get running() {
      return handle !== null
    },
    /** Live value and velocity (px/s) — hand them to the next animation on a reversal. */
    get value() {
      return state.value
    },
    get velocity() {
      return handle !== null ? state.velocity : 0
    },
  }
}
