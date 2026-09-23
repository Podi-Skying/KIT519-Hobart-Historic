/** 125 → "2:05" */
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** (1, "site") → "1 site", (3, "site") → "3 sites" */
export function pluralize(count, noun, plural = `${noun}s`) {
  return `${count} ${count === 1 ? noun : plural}`
}

/** 0.4 → "0.4 km" */
export function formatKm(km) {
  return `${km.toFixed(1)} km`
}

/** 118 → "120 m", 1530 → "1.5 km" (walking-direction style rounding). */
export function formatMeters(meters) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
