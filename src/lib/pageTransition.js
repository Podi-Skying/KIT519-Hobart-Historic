/**
 * Which route transition to play (base.css › Route transitions).
 * Apple's spatial-consistency rule: drilling down pushes in from the right, going back
 * reverses the same path, and switching tabs just cross-fades.
 *
 * @param {{ path: string, meta?: { tab?: string } }} to
 * @param {{ path: string, meta?: { tab?: string } } | null | undefined} from
 * @returns {'push' | 'pop' | 'fade' | 'none'}
 */
export function pageTransition(to, from) {
  // First navigation (app launch): the splash covers it, nothing to animate.
  if (!from || !from.matched?.length) return 'none'
  if (to.path === from.path) return 'none'
  const toTab = to.meta?.tab
  const fromTab = from.meta?.tab
  if (!toTab || toTab !== fromTab) return 'fade'
  const depth = (path) => path.split('/').filter(Boolean).length
  const delta = depth(to.path) - depth(from.path)
  if (delta > 0) return 'push'
  if (delta < 0) return 'pop'
  return 'fade'
}

/**
 * Where each page travels, in page widths (0 = in place, +1 = off to the right,
 * -0.28 = the parallax "underneath" position iOS uses for the page you came from).
 * Motion is a spring on this x (App.vue), so a reversal simply retargets from the live x.
 */
export const UNDER = -0.28
export function pageTargets(kind) {
  if (kind === 'push') return { enter: { from: 1, to: 0 }, leave: { from: 0, to: UNDER } }
  if (kind === 'pop') return { enter: { from: UNDER, to: 0 }, leave: { from: 0, to: 1 } }
  return null // fade / none: opacity only
}

/**
 * Inline style for a page at x (page widths): pages sliding over cast a shadow on the one
 * beneath; the page underneath dims slightly (depth, like iOS).
 */
export function pageStyle(x) {
  const under = Math.min(1, Math.max(0, x / UNDER)) // 0…1 as it slides beneath
  return {
    transform: x === 0 ? '' : `translateX(${(x * 100).toFixed(3)}%)`,
    filter: under > 0 ? `brightness(${(1 - 0.08 * under).toFixed(4)})` : '',
    boxShadow: x > 0 ? `-8px 0 24px rgba(44, 36, 23, ${(0.18 * Math.min(1, (1 - x) * 4)).toFixed(3)})` : '',
  }
}
