/**
 * localStorage wrapper that never throws (private mode, blocked storage,
 * server/test environments). Values are JSON-encoded.
 */
function backend() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export const storage = {
  read(key) {
    try {
      const raw = backend()?.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  write(key, value) {
    try {
      backend()?.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or unavailable — state stays in memory */
    }
  },
}
