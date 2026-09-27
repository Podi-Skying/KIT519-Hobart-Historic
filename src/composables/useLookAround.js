import { computed, onBeforeUnmount, ref } from 'vue'
import { createSpringAnimator, SPRINGS } from '@/lib/spring'
import { createVelocityTracker, project, rubberband } from '@/lib/gesture'
import { overscan, tiltOffset } from '@/lib/parallax'

/** Photo drawn this much larger than the frame: the margin it can slide within. */
export const LOOK_SCALE = 1.16
/** Gyro smoothing: a quick, critically damped spring (sensor noise without lag). */
const TILT_SPRING = { dampingRatio: 1, response: 0.25 }

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const needsPermission = () =>
  typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'
/** iOS asks once per page; remember a grant so every AR screen can use it. */
let motionGranted = !needsPermission()
/** True once motion sensors may be read without asking (always, except iOS before a grant). */
export const hasMotionPermission = () => motionGranted
/** iOS: ask for motion access; must run inside a tap. Resolves true when granted. */
export async function requestMotionPermission() {
  if (motionGranted) return true
  try {
    motionGranted = (await DeviceOrientationEvent.requestPermission()) === 'granted'
  } catch {
    motionGranted = false
  }
  return motionGranted
}

/**
 * "Look around" an AR photo: tilt the phone (gyro) and/or drag the photo. The photo slides within
 * its overscan margin — 1:1 with the finger, rubber-banding at the edges, thrown by momentum and
 * settled by a spring — and tilt is smoothed per axis by independent X/Y springs (Apple: decompose
 * 2D motion). `layer(depth)` gives each layer its transform: depth > 1 moves more (closer, e.g. the
 * hotspot bubbles) — that difference is the 3D parallax.
 * Reduced motion: no gyro (vestibular); dragging still works, it's the user's own motion.
 *
 * @param {{ frame: () => HTMLElement | null | undefined, drag?: boolean }} options
 */
export function useLookAround({ frame, drag = true }) {
  const dragX = ref(0)
  const dragY = ref(0)
  const tiltX = ref(0)
  const tiltY = ref(0)
  const motionOn = ref(false)
  const canAskMotion = ref(needsPermission() && !motionGranted && !reduceMotion())

  const margin = () => {
    const el = frame()
    return el ? overscan({ width: el.clientWidth, height: el.clientHeight }, LOOK_SCALE) : { x: 0, y: 0 }
  }

  // ---- tilt ----
  const springTX = createSpringAnimator((v) => (tiltX.value = v))
  const springTY = createSpringAnimator((v) => (tiltY.value = v))
  let base = null
  function onOrientation(e) {
    if (e.beta == null || e.gamma == null) return
    if (!base) base = { beta: e.beta, gamma: e.gamma }
    const m = margin()
    // leave half the margin for dragging
    const target = tiltOffset(e, base, { x: m.x / 2, y: m.y / 2 })
    springTX.animate({ from: tiltX.value, to: target.x, velocity: springTX.velocity, spring: TILT_SPRING })
    springTY.animate({ from: tiltY.value, to: target.y, velocity: springTY.velocity, spring: TILT_SPRING })
  }
  function listen() {
    if (motionOn.value || typeof window === 'undefined' || reduceMotion()) return
    window.addEventListener('deviceorientation', onOrientation)
    motionOn.value = true
  }
  /** iOS: must be called from a tap. Elsewhere it just starts listening. */
  async function enableMotion() {
    if (needsPermission()) await requestMotionPermission()
    canAskMotion.value = false
    if (motionGranted) listen()
  }
  if (motionGranted) listen()

  // ---- drag ----
  const springDX = createSpringAnimator((v) => (dragX.value = v))
  const springDY = createSpringAnimator((v) => (dragY.value = v))
  const trackX = createVelocityTracker()
  const trackY = createVelocityTracker()
  let start = null
  const now = () => performance.now()
  const limit = (v, max) => (Math.abs(v) <= max ? v : Math.sign(v) * (max + rubberband(Math.abs(v) - max, max * 4 || 1)))
  const handlers = {
    pointerdown(e) {
      if (!drag || e.button !== 0 || e.target.closest?.('button, a, input, [data-no-look]')) return
      springDX.stop()
      springDY.stop()
      start = { id: e.pointerId, x: e.clientX - dragX.value, y: e.clientY - dragY.value }
      trackX.reset(now(), dragX.value)
      trackY.reset(now(), dragY.value)
      e.currentTarget.setPointerCapture?.(e.pointerId)
    },
    pointermove(e) {
      if (!start || e.pointerId !== start.id) return
      const m = margin()
      dragX.value = limit(e.clientX - start.x, m.x)
      dragY.value = limit(e.clientY - start.y, m.y)
      trackX.add(now(), dragX.value)
      trackY.add(now(), dragY.value)
    },
    pointerup: release,
    pointercancel: release,
    // No separate "enable motion" button: iOS asks on the first tap anywhere in the view
    // (the permission prompt needs a tap; any tap on the photo, a bubble or a control counts).
    click() {
      if (canAskMotion.value) enableMotion()
    },
  }
  function release(e) {
    if (!start || e.pointerId !== start.id) return
    start = null
    const m = margin()
    // throw it where momentum carries it, then settle inside the margin
    const vx = trackX.velocity()
    const vy = trackY.velocity()
    const clampTo = (v, max) => Math.max(-max, Math.min(max, v))
    springDX.animate({ from: dragX.value, to: clampTo(dragX.value + project(vx, 0.995), m.x), velocity: vx * 1000, spring: SPRINGS.default })
    springDY.animate({ from: dragY.value, to: clampTo(dragY.value + project(vy, 0.995), m.y), velocity: vy * 1000, spring: SPRINGS.default })
  }

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('deviceorientation', onOrientation)
    ;[springTX, springTY, springDX, springDY].forEach((s) => s.stop())
  })

  const x = computed(() => dragX.value + tiltX.value)
  const y = computed(() => dragY.value + tiltY.value)
  /** Transform for a layer; depth 1 = the photo, > 1 = closer layers that move more. */
  const layer = (depth = 1, scale = 1) => ({
    transform: `translate3d(${(x.value * depth).toFixed(2)}px, ${(y.value * depth).toFixed(2)}px, 0) scale(${scale})`,
  })

  return { layer, handlers, enableMotion, canAskMotion, motionOn }
}
