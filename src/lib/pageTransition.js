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
