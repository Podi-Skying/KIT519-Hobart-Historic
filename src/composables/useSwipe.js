/**
 * Horizontal swipe detection for pointer (touch + mouse).
 * Returns handlers to bind with v-on: `<div v-on="swipe">`.
 * @param {(direction: 1 | -1) => void} onSwipe  1 = next (swiped left), -1 = previous
 * @param {number} threshold  minimum horizontal distance in px
 */
export function useSwipe(onSwipe, threshold = 40) {
  let startX = null
  return {
    pointerdown: (e) => {
      startX = e.clientX
    },
    pointerup: (e) => {
      if (startX === null) return
      const dx = e.clientX - startX
      startX = null
      if (Math.abs(dx) >= threshold) onSwipe(dx < 0 ? 1 : -1)
    },
    pointercancel: () => {
      startX = null
    },
  }
}
