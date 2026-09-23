import { onActivated, ref } from 'vue'

/**
 * Snap-scrolling horizontal carousel:
 *  - tracks the active slide while the user scrolls/swipes
 *  - `goTo(i)` for arrow buttons
 *  - mouse drag-to-scroll on desktop (a drag never triggers a card click)
 * Bind: `<div ref="track" @scroll="onScroll" v-on="dragHandlers">`
 */
export function useCarousel({ gutter = 20 } = {}) {
  const track = ref(null)
  const index = ref(0)
  let settleTimer = null
  let drag = null

  const offsetOf = (i) => {
    const slide = track.value?.children[i]
    return slide ? slide.offsetLeft - track.value.offsetLeft - gutter : 0
  }

  function onScroll() {
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      const el = track.value
      if (!el) return
      let best = 0
      for (let i = 1; i < el.children.length; i++) {
        if (Math.abs(offsetOf(i) - el.scrollLeft) < Math.abs(offsetOf(best) - el.scrollLeft)) best = i
      }
      index.value = best
    }, 80)
  }

  function goTo(i) {
    const el = track.value
    if (!el) return
    const next = Math.max(0, Math.min(el.children.length - 1, i))
    el.scrollTo({ left: offsetOf(next), behavior: 'smooth' })
    index.value = next
  }

  const endDrag = () => {
    if (!drag) return
    track.value.style.scrollSnapType = ''
    if (drag.moved) {
      // Swallow the click that follows a drag so cards don't open accidentally.
      track.value.addEventListener('click', (e) => e.preventDefault(), { capture: true, once: true })
    }
    drag = null
  }

  const dragHandlers = {
    pointerdown: (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      drag = { x: e.clientX, scroll: track.value.scrollLeft, moved: false }
      track.value.style.scrollSnapType = 'none'
    },
    pointermove: (e) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      if (Math.abs(dx) > 6) drag.moved = true
      track.value.scrollLeft = drag.scroll - dx
    },
    pointerup: endDrag,
    pointerleave: endDrag,
  }

  // KeepAlive restores the DOM but not horizontal scroll; put the slide back.
  onActivated(() => {
    if (track.value) track.value.scrollLeft = offsetOf(index.value)
  })

  return { track, index, goTo, onScroll, dragHandlers }
}
