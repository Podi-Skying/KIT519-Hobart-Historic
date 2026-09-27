import { createSpringAnimator, SPRINGS } from '@/lib/spring'
import { pageStyle, pageTargets } from '@/lib/pageTransition'

const FADE_MS = 220 // var(--dur)
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * JavaScript hooks for App.vue's route <Transition :css="false">.
 * push / pop: each page's x (in page widths) is a critically damped spring (lib/spring
 * SPRINGS.page), so the motion is physical and — Apple's first rule — interruptible:
 * tap Back while a page is still sliding in and it reverses from where it is, at its current
 * velocity, instead of finishing first. The page you return to is caught the same way.
 * fade (tab switches) and reduced motion: a short opacity cross-fade.
 *
 * @param {{ kind: () => string, path: () => string, previousPath: () => string }} route
 */
export function usePageTransition({ kind, path, previousPath }) {
  /** route path → the element of that page still animating out (so a quick return can catch it) */
  const leaving = new Map()

  const state = (el) => (el.__page ??= { x: 0, spring: null, finishLeave: null, path: null })

  function clear(el) {
    Object.assign(el.style, { transform: '', filter: '', boxShadow: '', position: '', inset: '', zIndex: '', opacity: '' })
  }

  function slide(el, from, to, velocity, done) {
    const s = state(el)
    s.spring?.stop()
    const spring = createSpringAnimator(
      (x) => {
        s.x = x
        Object.assign(el.style, pageStyle(x))
      },
      { epsilon: 0.0005 }, // x is in page widths: settle below ~0.2px
    )
    s.spring = spring
    s.x = from
    Object.assign(el.style, pageStyle(from))
    spring.animate({
      from,
      to,
      velocity,
      spring: SPRINGS.page,
      done: () => {
        s.spring = null
        done()
      },
    })
  }

  /** Current x and velocity if this element is mid-animation, else null. */
  function live(el) {
    const s = el.__page
    if (!s?.spring?.running) return null
    const v = s.spring.velocity
    s.spring.stop()
    return { x: s.x, v }
  }

  function fade(el, to, done) {
    el.style.opacity = to ? '0' : '1'
    const anim = el.animate?.([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: FADE_MS, easing: 'ease' })
    if (!anim) return done()
    anim.onfinish = () => {
      el.style.opacity = ''
      done()
    }
  }

  function onEnter(el, done) {
    const k = kind()
    const targets = pageTargets(k)
    state(el).path = path()
    if (k === 'none') return done()
    if (!targets || reduceMotion()) return fade(el, 1, done)

    let start = live(el) // KeepAlive page (Home) re-entering mid-leave: same element
    const earlier = leaving.get(path())
    if (!start && earlier && earlier !== el) {
      // The same page is still sliding out from a moment ago: take over its position and speed,
      // then let the old copy go — no second page, no jump.
      start = live(earlier) ?? { x: earlier.__page.x, v: 0 }
      earlier.__page.finishLeave?.()
    }
    el.style.position = 'relative'
    el.style.zIndex = k === 'push' ? '2' : '1'
    slide(el, start?.x ?? targets.enter.from, 0, start?.v ?? 0, () => {
      clear(el)
      done()
    })
  }

  function onLeave(el, done) {
    const k = kind()
    const targets = pageTargets(k)
    const s = state(el)
    const from = previousPath()
    s.path ??= from
    Object.assign(el.style, { position: 'absolute', inset: '0' })
    if (k === 'none') return done()
    if (!targets || reduceMotion()) return fade(el, 0, done)

    el.style.zIndex = k === 'push' ? '1' : '2'
    const start = live(el) // reversing a page that was still sliding in
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      s.spring?.stop()
      s.finishLeave = null
      if (leaving.get(s.path) === el) leaving.delete(s.path)
      clear(el)
      done()
    }
    s.finishLeave = finish
    leaving.set(s.path, el)
    slide(el, start?.x ?? targets.leave.from, targets.leave.to, start?.v ?? 0, finish)
  }

  return { onEnter, onLeave }
}
