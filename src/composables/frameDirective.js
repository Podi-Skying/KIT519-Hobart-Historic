import { watchEffect } from 'vue'

/**
 * A directive that keeps one DOM property in sync with reactive state on its own, without
 * re-rendering the component. For values that change every animation frame (a playhead, a
 * slider fill): a template binding would re-render the whole screen 60 times a second.
 *
 *   const vFade = frameDirective((el, i) => (el.style.opacity = opacityOf(i)))
 *   <img v-fade="i">
 *
 * `apply(el, bindingValue)` runs once on mount and again whenever the state it reads changes.
 * The binding value is read at mount (use it for constants such as an index).
 */
export function frameDirective(apply) {
  return {
    mounted(el, binding) {
      el.__frame = watchEffect(() => apply(el, binding.value), { flush: 'sync' })
    },
    unmounted(el) {
      el.__frame?.()
      delete el.__frame
    },
  }
}
