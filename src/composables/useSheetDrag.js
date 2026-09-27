import { computed, ref } from 'vue'
import { createVelocityTracker, project, releaseEasing, rubberband } from '@/lib/gesture'

/** Movement (px) before a press becomes a drag — shorter presses stay taps. */
const TAP_SLOP = 8
/** Dismiss when the release, projected forward by its momentum, would travel past this (px). */
const DISMISS_DISTANCE = 96
/** Must match the sheet's CSS transition (var(--dur)). */
const LEAVE_MS = 220
/** Upward pulls stretch against this size (px) — soft limit instead of a hard stop. */
const STRETCH = 400

/**
 * Drag a bottom panel down to dismiss it (touch + mouse), Apple-style:
 *  - 1:1 tracking downward; upward it rubber-bands instead of stopping dead
 *  - release velocity comes from the last ~100 ms, is projected forward (lib/gesture `project`)
 *    to decide dismiss vs. spring back, and is handed to the animation (`easing`) so there is
 *    no seam between finger and motion
 *  - interruptible: grabbing the panel while it springs back or slides away catches it
 *    where it is on screen and keeps following the finger
 * Presses can start on buttons inside the panel: they stay taps unless the pointer
 * moves down, and the click that ends a real drag is swallowed.
 *
 * Bind `handlers` with v-on and `swallowClick` with @click.capture on the drag area. Put
 * `style` on the element that moves, plus `--release-ease: easing` for its transition timing,
 * and disable its transition while `dragging`. Call `dismiss()` for buttons / Escape / scrim.
 * @param {() => void} onDismiss
 * @param {{ element?: () => HTMLElement | null | undefined }} [options] the moving element,
 *   read to catch it mid-animation
 */
export function useSheetDrag(onDismiss, { element } = {}) {
  const offset = ref(0)
  const dragging = ref(false)
  const leaving = ref(false)
  const easing = ref(undefined)
  const tracker = createVelocityTracker()
  let start = null
  let dragged = false
  let leaveTimer = null

  /** Pointer capture keeps the drag alive outside the panel; it can throw for stale pointers, which is harmless. */
  function capture(e, method) {
    try {
      if (!e.currentTarget?.[method]) return
      e.currentTarget[method](e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  /** Where the panel is on screen right now (mid-transition included), in px below its rest. */
  function presentationOffset() {
    const el = element?.()
    if (!el || typeof getComputedStyle !== 'function' || typeof DOMMatrixReadOnly !== 'function') return null
    const transform = getComputedStyle(el).transform
    return !transform || transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42
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

  function dismiss(velocity = 0) {
    if (leaving.value) return
    clearTimeout(leaveTimer)
    // Finish at the finger's speed: remaining distance ≈ the panel's height; use STRETCH as a stand-in.
    easing.value = releaseEasing(velocity, Math.max(1, STRETCH - offset.value), LEAVE_MS)
    leaving.value = true
    leaveTimer = setTimeout(() => {
      leaveTimer = null
      onDismiss()
      leaving.value = false
      offset.value = 0
      easing.value = undefined
    }, LEAVE_MS)
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
      // Spring back, starting at the finger's (upward) speed.
      easing.value = releaseEasing(-velocity, offset.value, LEAVE_MS)
      offset.value = 0
    }
  }

  function now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  const handlers = {
    pointerdown(e) {
      if (e.button !== 0) return
      // Interrupt: catch the panel wherever it is (sliding away or springing back).
      const caught = presentationOffset()
      if (leaving.value) {
        if (caught === null) return // can't read the live position (no DOM): let it finish
        clearTimeout(leaveTimer)
        leaveTimer = null
        leaving.value = false
      }
      const base = Math.max(0, caught ?? 0)
      offset.value = base
      easing.value = undefined
      start = { id: e.pointerId, x: e.clientX, y: e.clientY - base, base }
      tracker.reset(now(), base)
      dragged = false
      watchRelease(true)
      if (base > 0) {
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
    // --motion is 0 under prefers-reduced-motion: the panel fades out instead of sliding (base.css)
    if (leaving.value) return { transform: 'translateY(calc(100% * var(--motion)))', opacity: 'var(--motion)' }
    return offset.value ? { transform: `translateY(${offset.value}px)` } : null
  })

  return { handlers, swallowClick, style, dragging, leaving, easing, dismiss }
}
