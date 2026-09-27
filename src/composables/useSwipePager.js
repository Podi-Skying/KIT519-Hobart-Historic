import { ref } from 'vue'
import { createVelocityTracker, project } from '@/lib/gesture'

/** Horizontal travel (px) before a press becomes a swipe; vertical first = page scroll, not ours. */
const SLOP = 10

/**
 * 1:1 horizontal swipe for photo pagers (Gallery, Through time).
 * While the finger is down `offset` follows it exactly (through `resist` at the ends, for a
 * rubber-band); on release `onRelease` gets the offset, the recent velocity (px/ms) and where
 * the momentum would carry it (`projected`), so the view can pick the target from the
 * projection and hand the velocity on to its animation.
 * Presses that start on a button are left alone (arrows, close…).
 *
 * @param {{
 *   resist?: (dx: number) => number,
 *   onStart?: () => void,
 *   onMove?: (dx: number) => void,
 *   onRelease: (gesture: { offset: number, velocity: number, projected: number }) => void,
 * }} options
 */
export function useSwipePager({ resist = (dx) => dx, onStart, onMove, onRelease }) {
  const offset = ref(0)
  const dragging = ref(false)
  const tracker = createVelocityTracker()
  let start = null

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  function finish(e, cancelled) {
    if (!start || e.pointerId !== start.id) return
    const wasDragging = dragging.value
    start = null
    dragging.value = false
    if (!wasDragging) return
    try {
      e.currentTarget?.releasePointerCapture?.(e.pointerId)
    } catch {
      /* already released */
    }
    const velocity = cancelled ? 0 : tracker.velocity()
    onRelease({ offset: offset.value, velocity, projected: offset.value + project(velocity) })
  }

  const handlers = {
    pointerdown(e) {
      if (e.button !== 0 || e.target?.closest?.('button')) return
      start = { id: e.pointerId, x: e.clientX, y: e.clientY }
      tracker.reset(now(), 0)
    },
    pointermove(e) {
      if (!start || e.pointerId !== start.id) return
      const dx = e.clientX - start.x
      if (!dragging.value) {
        const dy = e.clientY - start.y
        if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) {
          start = null // vertical: let the page scroll
          return
        }
        if (Math.abs(dx) < SLOP) return
        dragging.value = true
        onStart?.()
        try {
          e.currentTarget?.setPointerCapture?.(e.pointerId)
        } catch {
          /* stale pointer */
        }
      }
      offset.value = resist(dx)
      tracker.add(now(), offset.value)
      onMove?.(offset.value)
    },
    pointerup: (e) => finish(e, false),
    pointercancel: (e) => finish(e, true),
    lostpointercapture: (e) => finish(e, false),
  }

  return { handlers, offset, dragging }
}
