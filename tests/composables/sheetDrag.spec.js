import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSheetDrag } from '@/composables/useSheetDrag'

const target = { setPointerCapture() {}, releasePointerCapture() {} }
const pointer = (y, x = 0, pointerId = 1) => ({ pointerId, button: 0, clientX: x, clientY: y, currentTarget: target })

/** Press at y=0, move down to `dy` over `ms`, release. */
function drag(sheet, dy, { ms = 500, dx = 0 } = {}) {
  sheet.handlers.pointerdown(pointer(0))
  vi.advanceTimersByTime(ms)
  sheet.handlers.pointermove(pointer(dy / 2, dx / 2))
  sheet.handlers.pointermove(pointer(dy, dx))
  sheet.handlers.pointerup(pointer(dy, dx))
}

/** Offset (px) the sheet is drawn at, from its style. */
const offsetOf = (sheet) => Number(/translateY\((-?[\d.]+)px\)/.exec(sheet.style.value?.transform ?? '')?.[1] ?? 0)

// Springs run on setTimeout here (no requestAnimationFrame in Node), so fake timers drive them.
const SETTLE = 1500

describe('useSheetDrag', () => {
  let onDismiss
  let sheet
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    onDismiss = vi.fn()
    sheet = useSheetDrag(onDismiss)
  })
  afterEach(() => vi.useRealTimers())

  it('follows the pointer down and springs out after a long drag', () => {
    sheet.handlers.pointerdown(pointer(0))
    sheet.handlers.pointermove(pointer(60))
    expect(sheet.style.value).toEqual({ transform: 'translateY(60px)' })
    vi.advanceTimersByTime(500)
    sheet.handlers.pointermove(pointer(150))
    sheet.handlers.pointerup(pointer(150))
    expect(sheet.leaving.value).toBe(true)
    vi.advanceTimersByTime(100)
    expect(offsetOf(sheet)).toBeGreaterThan(150) // on its way out
    vi.advanceTimersByTime(SETTLE)
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(sheet.style.value).toBeNull()
  })

  it('still finishes when the release lands outside the panel (no stuck half-open sheet)', () => {
    const win = new EventTarget()
    vi.stubGlobal('window', win)
    sheet.handlers.pointerdown(pointer(0))
    vi.advanceTimersByTime(500)
    sheet.handlers.pointermove(pointer(150))
    win.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 1 }))
    vi.advanceTimersByTime(SETTLE)
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(sheet.style.value).toBeNull()
    vi.unstubAllGlobals()
  })

  it('springs back after a short, slow drag', () => {
    drag(sheet, 50)
    vi.advanceTimersByTime(50)
    const mid = offsetOf(sheet)
    expect(mid > 0 && mid < 50).toBe(true) // animating, not jumping
    vi.advanceTimersByTime(SETTLE)
    expect(sheet.style.value).toBeNull()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on a quick downward flick', () => {
    drag(sheet, 70, { ms: 50 })
    vi.advanceTimersByTime(SETTLE)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('can be caught while it springs back, right where it is', () => {
    drag(sheet, 80)
    vi.advanceTimersByTime(40)
    const live = offsetOf(sheet)
    sheet.handlers.pointerdown(pointer(300))
    expect(sheet.dragging.value).toBe(true)
    vi.advanceTimersByTime(200)
    expect(offsetOf(sheet)).toBe(live) // the spring stopped under the finger
    sheet.handlers.pointermove(pointer(310))
    expect(offsetOf(sheet)).toBeCloseTo(live + 10, 5)
  })

  it('can be caught while it slides away, and then does not dismiss', () => {
    drag(sheet, 150)
    vi.advanceTimersByTime(30)
    sheet.handlers.pointerdown(pointer(500))
    expect(sheet.leaving.value).toBe(false)
    vi.advanceTimersByTime(SETTLE)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('rubber-bands when pulled up past its resting place', () => {
    sheet.handlers.pointerdown(pointer(0))
    sheet.handlers.pointermove(pointer(20)) // becomes a drag
    sheet.handlers.pointermove(pointer(-100))
    const y = offsetOf(sheet)
    expect(y < 0 && y > -100 * 0.55).toBe(true)
  })

  it('ignores sideways moves and other pointers', () => {
    drag(sheet, 5, { dx: -80 })
    sheet.handlers.pointerdown(pointer(0))
    sheet.handlers.pointermove({ ...pointer(200), pointerId: 2 })
    expect(sheet.style.value).toBeNull()
    expect(sheet.dragging.value).toBe(false)
  })

  it('swallows the click that ends a drag, but not a plain tap', () => {
    const click = () => ({ stopPropagation: vi.fn(), preventDefault: vi.fn() })
    drag(sheet, 50)
    const afterDrag = click()
    sheet.swallowClick(afterDrag)
    expect(afterDrag.stopPropagation).toHaveBeenCalled()

    vi.advanceTimersByTime(SETTLE) // settled: the next press is a plain tap again
    sheet.handlers.pointerdown(pointer(0))
    sheet.handlers.pointerup(pointer(2))
    const tap = click()
    sheet.swallowClick(tap)
    expect(tap.stopPropagation).not.toHaveBeenCalled()
  })

  it('dismiss() (✕, Escape, scrim) animates out the same way', () => {
    sheet.dismiss()
    expect(sheet.leaving.value).toBe(true)
    vi.advanceTimersByTime(SETTLE)
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
