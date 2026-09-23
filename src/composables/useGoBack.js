import { useRouter } from 'vue-router'

/**
 * Back navigation that still works when the page was opened directly
 * (deep link / refresh) and there is no in-app history to return to.
 * @param {import('vue-router').RouteLocationRaw} fallback
 */
export function useGoBack(fallback = { name: 'home' }) {
  const router = useRouter()
  return () => {
    if (window.history.state?.back) router.back()
    else router.replace(fallback)
  }
}
