import { afterEach, describe, expect, it, vi } from 'vitest'
import { haptic, PATTERNS, stopToggleHaptic } from '@/services/haptics'

describe('haptics', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('maps stop results to feedback kinds', () => {
    expect(stopToggleHaptic('added')).toBe('selection')
    expect(stopToggleHaptic('removed')).toBe('selection')
    expect(stopToggleHaptic('full')).toBe('warning')
  })

  it('vibrates with the pattern for the kind', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    expect(haptic('success')).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(PATTERNS.success)
  })

  it('does nothing where the Vibration API is missing or the kind is unknown', () => {
    vi.stubGlobal('navigator', {})
    expect(haptic('success')).toBe(false)
    vi.stubGlobal('navigator', { vibrate: vi.fn() })
    expect(haptic('nope')).toBe(false)
  })
})
