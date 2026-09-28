/**
 * Haptic feedback through the Vibration API (Android browsers; iOS Safari ignores it,
 * which is fine — it is an enhancement, never the only signal).
 * Apple's three rules (Designing Audio-Haptic Experiences):
 *  - causality: fire on the event itself (the stop being added, the arrival), same frame as the visual
 *  - harmony: short and light for small things, a distinct pattern for success/warning
 *  - utility: only meaningful moments — so this is called from a handful of places, not every tap
 */

/** kind → navigator.vibrate pattern (ms). Pure, so it is unit-tested. */
export const PATTERNS = Object.freeze({
  selection: [8], // a choice clicked into place: stop added/removed, carousel scrub tick
  success: [12, 60, 24], // task complete: arrived
  warning: [30, 50, 30], // couldn't do it: stop limit reached
})

/** Maps a trip.toggleStop() result to the feedback kind. */
export function stopToggleHaptic(result) {
  return result === 'full' ? 'warning' : 'selection'
}

export function haptic(kind) {
  const pattern = PATTERNS[kind]
  if (!pattern || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  // Browsers refuse (and log an error) before the first tap on the page, e.g. an arrival that
  // fires on a deep link. Skip quietly then; it is never the only feedback anyway.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return false
  try {
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}
