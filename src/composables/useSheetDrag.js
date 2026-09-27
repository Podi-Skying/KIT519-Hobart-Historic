import { computed, ref } from 'vue'
import { createVelocityTracker, project, rubberband } from '@/lib/gesture'
import { createSpringAnimator, SPRINGS } from '@/lib/spring'

/** Movement (px) before a press becomes a drag — shorter presses stay taps. */
const TAP_SLOP = 8
/** Dismiss when the release, projected forward by its momentum, would travel past this (px). */
const DISMISS_DISTANCE = 96
/** Reduced motion: the sheet fades instead (matches its CSS opacity transition, var(--dur)). */
const FADE_MS = 220
/** Upward pulls stretch against this size (px) — soft limit instead of a hard stop. */
const STRETCH = 400
/** An upward release faster than this (px/ms) carried momentum: settle with a little bounce. */
const FLICK = 0.5

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Drag a bottom panel down to dismiss it (touch + mouse), Apple-style (Designing Fluid Interfaces):
 *  - 1:1 tracking downward; upward it rubber-bands instead of stopping dead
 *  - release velocity from the last ~100 ms, projected forward (lib/gesture `project`) to
 *    decide dismiss vs. settle back
 *  - the release is animated by a real spring (lib/spring) that starts at the finger's
 *    velocity: critically damped normally, damping 0.8 after an upward flick (momentum earns
 *    a small bounce); dismissal slides out at the flick's speed
 *  - interruptible: grab it while it settles or slides away and it stops right there, under
 *    the finger (the spring owns the live value, so there is no jump)
 *  - reduced motion: no slide, the sheet cross-fades out
 * Presses can start on buttons inside the panel: they stay taps unless the pointer
 * moves down, and the click that ends a real drag is swallowed.
 *
 * Bind `handlers` with v-on and `swallowClick` with @click.capture on the drag area. Put
 * `style` on the element that moves (it must not have a CSS transition on `transform`).
 * Call `dismiss()` for buttons / Escape / scrim.
 * @param {() => void} onDismiss
 * @param {{ element?: () => HTMLElement | null | undefined }} [options] the moving element
 *   (its height is how far a dismissal travels)
 */
export function useSheetDrag(onDismiss, { element } = {}) {
  const offset = ref(0)
  const dragging = ref(false)
  const leaving = ref(false)
  const fading = ref(false)
  const tracker = createVelocityTracker()
  const spring = createSpringAnimator((value) => (offset.value = value))
  let start = null
  let dragged = false
  let fadeTimer = null

  /** Pointer capture keeps the drag alive outside the panel; it can throw for stale pointers, which is harmless. */
  function capture(e, method) {
    try {
      if (!e.currentTarget?.[method]) return
      e.currentTarget[method](e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  /** Only the pointer that started the press counts (ignores a second finger or a hovering mouse). */
  const isOwn = (e) => start && e.pointerId === start.id

  /**
   * Safety net: if pointer capture fails or is lost (release outside the panel or the
   * window, a browser gesture), the panel still gets its release, so a drag can never
   * be left stuck half-open with the map behind it not resized.
   */
  const release = (e) => end(e)
  const releaseAll = () => end({ pointerId: start?.id, currentTarget: null })
  function watchRelease(on) {
    if (typeof window === 'undefined') return
    const method = on ? 'addEventListener' : 'removeEventListener'
    window[method]('pointerup', release, true)
    window[method]('pointercancel', release, true)
    window[method]('blur', releaseAll)
  }

  function finish() {
    spring.stop()
    clearTimeout(fadeTimer)
    fadeTimer = null
    onDismiss()
    leaving.value = false
    fading.value = false
    offset.value = 0
  }

  /** Animate out, then call onDismiss. `velocity` in px/ms (downward +). */
  function dismiss(velocity = 0) {
    if (leaving.value) return
    leaving.value = true
    if (prefersReducedMotion()) {
      fading.value = true
      fadeTimer = setTimeout(finish, FADE_MS)
      return
    }
    const height = element?.()?.offsetHeight || 600
    spring.animate({ from: offset.value, to: height, velocity: velocity * 1000, spring: SPRINGS.sheet, done: finish })
  }

  function end(e) {
    if (!isOwn(e)) return
    watchRelease(false)
    start = null
    if (!dragging.value) return
    dragging.value = false
    capture(e, 'releasePointerCapture')
    const velocity = tracker.velocity() // px/ms, + = downward
    if (offset.value > 0 && offset.value + project(velocity) > DISMISS_DISTANCE) {
      dismiss(velocity)
    } else {
      spring.animate({
        from: offset.value,
        to: 0,
        velocity: velocity * 1000,
        spring: velocity < -FLICK ? SPRINGS.flick : SPRINGS.sheet,
      })
    }
  }

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  const handlers = {
    pointerdown(e) {
      if (e.button !== 0) return
      if (fading.value) return // reduced-motion fade is short; let it finish
      // Interrupt: whatever the spring was doing, it stops where it is, under the finger.
      const caught = spring.running
      const base = caught ? spring.stop() : offset.value
      leaving.value = false
      start = { id: e.pointerId, x: e.clientX, y: e.clientY - Math.max(0, base) }
      offset.value = base
      tracker.reset(now(), base)
      dragged = false
      watchRelease(true)
      if (caught) {
        // It was moving: the finger owns it from the first frame.
        dragging.value = true
        dragged = true
        capture(e, 'setPointerCapture')
      }
    },
    pointermove(e) {
      if (!isOwn(e)) return
      const dy = e.clientY - start.y
      if (!dragging.value) {
        const dx = Math.abs(e.clientX - start.x)
        // Sideways or upward: not ours (e.g. the stop row scrolling horizontally)
        if ((dx > TAP_SLOP && dx > dy) || dy < -TAP_SLOP) {
          start = null
          watchRelease(false)
          return
        }
        if (dy < TAP_SLOP) return
        dragging.value = true
        dragged = true
        capture(e, 'setPointerCapture')
      }
      // Down: 1:1. Up past the resting position: rubber-band.
      offset.value = dy >= 0 ? dy : rubberband(dy, STRETCH)
      tracker.add(now(), offset.value)
    },
    pointerup: end,
    pointercancel: end,
    lostpointercapture: end,
  }

  function swallowClick(e) {
    if (!dragged) return
    dragged = false
    e.stopPropagation()
    e.preventDefault()
  }

  const style = computed(() => {
    if (fading.value) return { opacity: 0 } // reduced motion: cross-fade out (CSS opacity transition)
    if (leaving.value || offset.value) return { transform: `translateY(${offset.value}px)` }
    return null
  })

  return { handlers, swallowClick, style, dragging, leaving, dismiss }
}
