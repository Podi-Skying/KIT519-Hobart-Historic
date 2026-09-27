/**
 * Make sure people see the latest deploy. GitHub Pages lets browsers (and iOS home-screen
 * apps) keep the old index.html for a while, so a phone could run an old build long after a
 * push. We fetch index.html fresh and compare its main script with the one running:
 *  - at launch (the splash is showing, nothing to lose): reload straight away, once;
 *  - when the app comes back to the foreground: offer a Reload toast instead of yanking the
 *    page away mid-walk.
 */
import { newerBuild } from '@/lib/build'

const RELOADED_KEY = 'hh.reloadedFor'

async function latestScript() {
  const html = await fetch(`./?build=${Date.now()}`, { cache: 'no-store' }).then((r) => r.text())
  return /assets\/index-[\w-]+\.js/.exec(html)?.[0] ?? null
}

/** @param {{ offer: (reload: () => void) => void }} ui  shows the "new version" toast */
export function watchForUpdates({ offer }) {
  if (import.meta.env.DEV || typeof document === 'undefined') return
  const running = document.querySelector('script[type="module"][src*="assets/index-"]')?.getAttribute('src') ?? ''
  const reload = () => window.location.reload()

  async function check(atLaunch) {
    try {
      const latest = await latestScript()
      if (!newerBuild(running, latest)) return
      if (atLaunch) {
        if (sessionStorage.getItem(RELOADED_KEY) === latest) return // never loop
        sessionStorage.setItem(RELOADED_KEY, latest)
        reload()
      } else {
        offer(reload)
      }
    } catch {
      /* offline or blocked: keep running this build */
    }
  }

  check(true)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check(false))
}
