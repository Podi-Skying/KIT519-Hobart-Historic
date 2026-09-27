import { computed, onBeforeUnmount, ref } from 'vue'
import { createVelocityTracker, rubberband, snapPoint } from '@/lib/gesture'
import { createSpringAnimator, SPRINGS } from '@/lib/spring'

const TAP_SLOP = 8

/**
 * A bottom panel with two resting places: expanded, and collapsed to a slim "peek" (e.g. just
 * time and distance) so the map behind is free. Drag its handle 1:1 (rubber-band past either
 * end), release and momentum picks the side (lib/gesture snapPoint), a spring finishes from the
 * finger's speed — with a little bounce after a flick. Tap the handle to toggle. Grabbing it
 * mid-animation catches it where it is.
 *
 * Bind `handlers` + `swallowClick` (@click.capture) on the handle, `style` on the panel.
 * @param {{ element: () => HTMLElement | null | undefined, peek: () => number }} options
 *   peek: px of the panel that stays visible when collapsed (measured from its top)
 */
export function useSnapSheet({ element, peek }) {
  const collapsed = ref(false)
  /** px pulled down from expanded while moving; null when at rest (then CSS keeps it in place). */
  const offset = ref(null)
  const dragging = ref(false)
  const tracker = createVelocityTracker()
  const spring = createSpringAnimator((v) => (offset.value = v))
  let start = null
  let dragged = false

  const max = () => Math.max(0, (element()?.offsetHeight ?? 0) - peek())
  const now = () => performance.now()

  function settle(target, velocity = 0) {
    const flick = Math.abs(velocity) > 0.5
    spring.animate({
      from: offset.value ?? (collapsed.value ? max() : 0),
      to: target,
      velocity: velocity * 1000,
      spring: flick ? SPRINGS.flick : SPRINGS.sheet,
      done: () => {
        collapsed.value = target > 0
        offset.value = null // at rest: the CSS form below keeps it right even if the content resizes
      },
    })
    collapsed.value = target > 0
  }

  function toggle() {
    settle(collapsed.value ? 0 : max())
  }

  const handlers = {
    pointerdown(e) {
      if (e.button !== 0) return
      const caught = spring.running
      const from = caught ? spring.stop() : collapsed.value ? max() : 0
      offset.value = from
      start = { id: e.pointerId, y: e.clientY - from, from }
      tracker.reset(now(), from)
      dragged = caught
      dragging.value = caught
      if (caught) e.currentTarget.setPointerCapture?.(e.pointerId)
    },
    pointermove(e) {
      if (!start || e.pointerId !== start.id) return
      const y = e.clientY - start.y
      if (!dragging.value) {
        if (Math.abs(y - start.from) < TAP_SLOP) return
        dragging.value = true
        dragged = true
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
      const m = max()
      offset.value = y < 0 ? rubberband(y, m || 1) : y > m ? m + rubberband(y - m, m || 1) : y
      tracker.add(now(), offset.value)
    },
    pointerup: end,
    pointercancel: end,
  }
  function end(e) {
    if (!start || e.pointerId !== start.id) return
    start = null
    if (!dragging.value) {
      if (offset.value !== null && !spring.running) offset.value = null
      return // a tap: the handle's click toggles
    }
    dragging.value = false
    const v = tracker.velocity()
    settle(snapPoint(offset.value, v, max()), v)
  }
  function swallowClick(e) {
    if (!dragged) return
    dragged = false
    e.stopPropagation()
    e.preventDefault()
  }

  onBeforeUnmount(() => spring.stop())

  const style = computed(() => {
    if (offset.value !== null) return { transform: `translateY(${offset.value}px)` }
    return collapsed.value ? { transform: `translateY(calc(100% - ${peek()}px))` } : null
  })

  return { handlers, swallowClick, style, collapsed, dragging, toggle, expand: () => settle(0) }
}
