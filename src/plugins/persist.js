import { storage } from '@/lib/storage'

const PREFIX = 'hobart-heritage:'

/**
 * Pinia plugin: persist selected state keys to localStorage.
 * Opt in per store with `persist: { paths: ['a', 'b'] }` in the store options.
 * Bump `version` to discard incompatible saved data after a schema change.
 */
export function persistPlugin({ store, options }) {
  const config = options.persist
  if (!config) return

  const key = `${PREFIX}${store.$id}`
  const version = config.version ?? 1
  const pick = (state) => Object.fromEntries(config.paths.map((path) => [path, state[path]]))

  const saved = storage.read(key)
  if (saved?.version === version) store.$patch(saved.state)

  store.$subscribe((_mutation, state) => storage.write(key, { version, state: pick(state) }), {
    detached: true,
  })
}
