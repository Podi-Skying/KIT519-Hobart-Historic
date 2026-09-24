import { computed, ref } from 'vue'

/** Movement (px) before a press becomes a drag — shorter presses stay taps. */
const TAP_SLOP = 8
/** Drag further than this (px) — or flick faster than FLICK_VELOCITY px/ms — to dismiss. */
const DISMISS_DISTANCE = 96
const FLICK_VELOCITY = 0.6
const LEAVE_MS = 220

/**
 * Drag a bottom panel down to dismiss it (touch + mouse).
 * The panel follows the pointer; releasing past DISMISS_DISTANCE (or flicking down)
 * slides it out and calls `onDismiss`, anything shorter springs back.
 * Presses can start on buttons inside the panel: they stay taps unless the pointer
 * moves down, and the click that ends a real drag is swallowed.
 *
 * Bind `handlers` with v-on and `swallowClick` with @click.capture on the drag area;
 * put `style` on the element that should move, and disable its transition while `dragging`.
 * @param {() => void} onDismiss
 */
export function useSheetDrag(onDismiss) {
  const offset = ref(0)
  const dragging = ref(false)
  const leaving = ref(false)
  let start = null
  let dragged = false

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

  function end(e) {
    if (!isOwn(e)) return
    watchRelease(false)
    const velocity = offset.value / Math.max(1, performance.now() - start.t)
    start = null
    if (!dragging.value) return
    dragging.value = false
    capture(e, 'releasePointerCapture')
    if (offset.value > DISMISS_DISTANCE || velocity > FLICK_VELOCITY) {
      leaving.value = true
      setTimeout(() => {
        onDismiss()
        leaving.value = false
        offset.value = 0
      }, LEAVE_MS)
    } else {
      offset.value = 0 // spring back
    }
  }

  const handlers = {
    pointerdown(e) {
      if (leaving.value || e.button !== 0) return
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }
      dragged = false
      watchRelease(true)
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
      offset.value = Math.max(0, dy) // only downward
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
    if (leaving.value) return { transform: 'translateY(100%)' }
    return offset.value ? { transform: `translateY(${offset.value}px)` } : null
  })

  return { handlers, swallowClick, style, dragging }
}
