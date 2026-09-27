/**
 * True when the freshly fetched index.html points at a different main script than the one
 * running (Vite hashes the file name, so a new deploy = a new name). Pure, unit-tested.
 * @param {string} runningSrc  e.g. "./assets/index-CI1hk87m.js"
 * @param {string|null} latest  e.g. "assets/index-bXl205l4.js"
 */
export function newerBuild(runningSrc, latest) {
  if (!runningSrc || !latest) return false
  return !runningSrc.endsWith(latest)
}
