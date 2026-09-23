import { onActivated, onBeforeUnmount, onDeactivated, onMounted } from 'vue'

/**
 * Global keyboard shortcuts for the active view. Ignored while typing in a field.
 * @param {Record<string, (e: KeyboardEvent) => void>} handlers  keyed by `event.key`
 */
export function useKeydown(handlers) {
  const listener = (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea')) return
    handlers[event.key]?.(event)
  }
  const on = () => window.addEventListener('keydown', listener)
  const off = () => window.removeEventListener('keydown', listener)
  onMounted(on)
  onActivated(on)
  onDeactivated(off)
  onBeforeUnmount(off)
}
