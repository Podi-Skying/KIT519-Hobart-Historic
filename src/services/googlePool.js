/**
 * Reuse Google Maps and Street View instances instead of creating new ones.
 *
 * The Maps JavaScript API has no way to destroy a map or panorama: every `new Map()` /
 * `new StreetViewPanorama()` keeps its WebGL context, tiles, workers and listeners alive for
 * the rest of the session. Opening Map → Navigation → AR navigation a few times therefore
 * piled up dozens of live maps and the app got slower the longer it was used. Google's own
 * guidance is to reuse instances; this pool hands back a detached one when a screen unmounts
 * and moves its element into the next screen that needs one.
 *
 * Each entry is { element, instance }: `element` is the div the instance was created in.
 */
const pools = { map: [], pano: [] }

function acquire(kind, container, create, reuse) {
  let entry = pools[kind].pop()
  if (entry) reuse(entry.instance)
  else {
    const element = document.createElement('div')
    element.style.cssText = 'position:absolute;inset:0'
    entry = { element, instance: null }
    container.append(element) // Google measures the element on creation
    entry.instance = create(element)
    return entry
  }
  container.append(entry.element)
  return entry
}

function release(kind, entry, reset) {
  if (!entry) return
  try {
    reset(entry.instance)
    window.google?.maps?.event?.clearInstanceListeners(entry.instance)
  } catch {
    /* a Google-side failure (e.g. after an auth error) must not block unmounting */
  }
  entry.element.remove()
  pools[kind].push(entry)
}

/** A Map in `container` with `options` (mapId is fixed per page, so every pooled map shares it). */
export const acquireMap = (api, container, options) =>
  acquire(
    'map',
    container,
    (el) => new api.Map(el, options),
    (map) => map.setOptions(options),
  )
export const releaseMap = (entry) => release('map', entry, () => {})

/** A StreetViewPanorama in `container`; the caller sets pano / pov after acquiring. */
export const acquirePanorama = (sv, container, options) =>
  acquire(
    'pano',
    container,
    (el) => new sv.StreetViewPanorama(el, options),
    (pano) => {
      pano.setOptions(options)
      pano.setVisible(true)
    },
  )
export const releasePanorama = (entry) =>
  release('pano', entry, (pano) => {
    pano.setMotionTracking(false) // stop reading the gyro while parked
    pano.setVisible(false)
  })

/** For tests / diagnostics: how many instances are parked. */
export const pooledCount = () => ({ map: pools.map.length, pano: pools.pano.length })
