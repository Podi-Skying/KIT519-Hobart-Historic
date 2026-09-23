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

describe('useSheetDrag', () => {
  let onDismiss
  let sheet
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'performance'] })
    onDismiss = vi.fn()
    sheet = useSheetDrag(onDismiss)
  })
  afterEach(() => vi.useRealTimers())

  it('follows the pointer down and dismisses after a long drag', () => {
    sheet.handlers.pointerdown(pointer(0))
    sheet.handlers.pointermove(pointer(60))
    expect(sheet.style.value).toEqual({ transform: 'translateY(60px)' })
    vi.advanceTimersByTime(500)
    sheet.handlers.pointermove(pointer(150))
    sheet.handlers.pointerup(pointer(150))
    expect(sheet.style.value).toEqual({ transform: 'translateY(100%)' })
    vi.advanceTimersByTime(300)
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(sheet.style.value).toBeNull()
  })

  it('springs back after a short, slow drag', () => {
    drag(sheet, 50)
    expect(sheet.style.value).toBeNull()
    vi.advanceTimersByTime(300)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on a quick downward flick', () => {
    drag(sheet, 70, { ms: 50 })
    vi.advanceTimersByTime(300)
    expect(onDismiss).toHaveBeenCalledOnce()
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

    sheet.handlers.pointerdown(pointer(0))
    sheet.handlers.pointerup(pointer(2))
    const tap = click()
    sheet.swallowClick(tap)
    expect(tap.stopPropagation).not.toHaveBeenCalled()
  })
})
