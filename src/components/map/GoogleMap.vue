<script setup>
/**
 * Google Map used by every map screen (Map tab, turn-by-turn, AR mini-map, print).
 * Draws site pins at their real coordinates, the walker (or route start), and a
 * route polyline — solid along real streets, dashed when it is only a straight-line
 * estimate. Emits `error` if the API can't load or the key is rejected so the
 * parent can fall back to the illustrated map.
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadGoogleMaps, MAP_ID, onGoogleMapsAuthFailure } from '@/services/googleMaps'
import { acquireMap, releaseMap } from '@/services/googlePool'
import { HOBART_CENTRE } from '@/data/navigation'
import { offsetPoint } from '@/lib/streetView'
import { ICONS } from '@/assets/icons'

const props = defineProps({
  sites: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  /** Points to draw as the route (empty = no route). */
  routePath: { type: Array, default: () => [] },
  /** Hex colour of the route line. */
  routeColor: { type: String, default: '#7D3045' },
  /** true = follows real streets (solid line); false = straight-line estimate (dashed). */
  realRoute: { type: Boolean, default: false },
  /** Amenity stops on the route: { id, icon, label, position }. */
  amenities: { type: Array, default: () => [] },
  /** Labelled feature points of the route (steepest stretch, high point…): { id, icon, label, position }. */
  highlights: { type: Array, default: () => [] },
  /** Other route types drawn faint so the difference shows; tap to switch: { key, path, hex, label }. */
  alternatives: { type: Array, default: () => [] },
  /** Live walker position (blue dot), or null. */
  user: { type: Object, default: null },
  /** Route start marker, shown when there is no live walker position. */
  start: { type: Object, default: null },
  /** 'all' frames every pin (+ walker); 'route' frames the route. */
  fit: { type: String, default: 'all', validator: (v) => ['all', 'route'].includes(v) },
  interactive: { type: Boolean, default: true },
  showLabels: { type: Boolean, default: true },
  /** Map tab: hovering (or focusing) a landmark pops up its photo and name above the pin. */
  previews: { type: Boolean, default: false },
  /**
   * AR navigation "follow" camera (like Google Maps Live View): { position, heading }.
   * The map turns heading-up around the walker (a vector map), zoomed in, with the walker
   * low in the frame and a heading arrow instead of the dot. null = normal framing.
   */
  follow: { type: Object, default: null },
  /** Map padding (px) around fitted content — keep pins clear of overlays. */
  padding: { type: Object, default: () => ({ top: 96, right: 72, bottom: 32, left: 32 }) },
})
const emit = defineEmits(['select', 'select-route', 'error', 'ready'])

const { t } = useI18n()
const container = ref(null)
const map = shallowRef(null)
let api = null
let userMarker = null
let startMarker = null
let routeLine = null
const pins = new Map() // siteId → { marker, element }
/** { element, instance } from the map pool while mounted */
let pooled = null
let amenityPins = []
let highlightPins = []
/** Listeners on the pooled map: removed on unmount, or every reuse of the map would stack another. */
let mapListeners = []
let alternativeLines = []
let offAuthFailure = () => {}

// ---------- marker DOM ----------
function pinElement(site) {
  const el = document.createElement('div')
  el.className = 'gm-pin pressable' // press feedback: base.css › Press feedback
  const head = document.createElement('span')
  head.className = 'gm-pin__head'
  const num = document.createElement('b')
  num.textContent = String(site.id)
  head.append(num)
  el.append(head)
  if (props.previews) {
    const card = document.createElement('span')
    card.className = 'gm-pin__preview'
    const img = document.createElement('img')
    img.src = site.image
    img.alt = ''
    img.loading = 'lazy'
    img.decoding = 'async'
    const name = document.createElement('span')
    name.textContent = site.name
    card.append(img, name)
    el.append(card)
    el.classList.add('has-preview')
  }
  if (props.showLabels) {
    const label = document.createElement('span')
    label.className = 'gm-pin__label'
    label.textContent = site.shortName
    el.append(label)
  }
  return el
}
/** Round icon badge for an amenity stop (icon markup is from the trusted static registry). */
function amenityElement(amenity) {
  const el = document.createElement('div')
  el.className = 'gm-amenity'
  el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[amenity.icon] ?? ''}</svg>`
  return el
}
/** Labelled chip for a route feature point (icon markup from the trusted static registry, label as text). */
function highlightElement(highlight) {
  const el = document.createElement('div')
  el.className = 'gm-highlight'
  el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[highlight.icon] ?? ''}</svg>`
  const text = document.createElement('span')
  text.textContent = highlight.label
  el.append(text)
  return el
}
const dotElement = (className) => {
  const el = document.createElement('div')
  el.className = className
  return el
}

// ---------- camera ----------
function frame(points) {
  if (!map.value || !points.length) return
  if (points.length === 1) {
    map.value.setCenter(points[0])
    if (map.value.getZoom() < 16) map.value.setZoom(16)
    return
  }
  const bounds = new api.LatLngBounds()
  points.forEach((p) => bounds.extend(p))
  map.value.fitBounds(bounds, props.padding)
}

/** Follow camera: heading-up, the walker a third of the way up from the bottom. */
const FOLLOW_ZOOM = 18
const FOLLOW_LEAD_M = 30 // centre this far ahead of the walker
function followCamera() {
  if (!map.value || !props.follow?.position) return
  const { position, heading = 0 } = props.follow
  map.value.moveCamera({ center: offsetPoint(position, heading, FOLLOW_LEAD_M), zoom: FOLLOW_ZOOM, heading, tilt: 0 })
  syncHeadingArrow()
}
let headingMarker = null
function syncHeadingArrow() {
  if (!map.value) return
  const position = props.follow?.position ?? null
  headingMarker = syncMarker(headingMarker, position, 'gm-heading', t('map.yourLocation'))
  if (!headingMarker) return
  // a vector map turns heading-up (arrow points up); a raster fallback stays north-up, so the
  // arrow itself turns. Read the rendering type, not getHeading(): right after moveCamera the
  // heading can still read 0 and the arrow ended up skewed by the route's bearing.
  const vector = map.value.getRenderingType?.() === 'VECTOR'
  const turn = vector ? 0 : props.follow.heading ?? 0
  headingMarker.content.style.setProperty('--turn', `${turn}deg`)
}

/** Frame according to `fit`. */
function recenter() {
  if (props.follow) return followCamera()
  if (props.fit === 'route' && props.routePath.length) return frame(props.routePath)
  frame([...props.sites.map((s) => s.coordinates), ...(props.user ? [props.user] : [])])
}

function focusUser() {
  if (!map.value || !props.user) return
  map.value.panTo(props.user)
  if (map.value.getZoom() < 17) map.value.setZoom(17)
}

const zoomBy = (delta) => map.value?.setZoom(map.value.getZoom() + delta)

// ---------- overlays ----------
function syncSelection() {
  for (const [id, { marker, element }] of pins) {
    const selected = id === props.selectedId
    element.classList.toggle('is-selected', selected)
    marker.zIndex = selected ? 10 : 1
  }
}

function syncRoute() {
  routeLine?.setMap(null)
  routeLine = null
  if (!map.value || props.routePath.length < 2) return
  const color = props.routeColor
  routeLine = new api.Polyline({
    map: map.value,
    path: props.routePath,
    geodesic: true,
    strokeColor: color,
    strokeWeight: props.realRoute ? 5 : 4,
    strokeOpacity: props.realRoute ? 0.9 : 0,
    zIndex: 2,
    icons: props.realRoute
      ? []
      : [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: color, scale: 3 }, offset: '0', repeat: '12px' }],
  })
}

function syncAlternatives() {
  alternativeLines.forEach((line) => line.setMap(null))
  alternativeLines = []
  if (!map.value) return
  alternativeLines = props.alternatives.map((alt) => {
    const line = new api.Polyline({
      map: map.value,
      path: alt.path,
      geodesic: true,
      strokeColor: alt.hex,
      strokeOpacity: 0.4,
      strokeWeight: 4,
      zIndex: 1,
      clickable: props.interactive,
    })
    if (props.interactive) line.addListener('click', () => emit('select-route', alt.key))
    return line
  })
}
function syncHighlights() {
  highlightPins.forEach((marker) => (marker.map = null))
  highlightPins = []
  if (!map.value) return
  highlightPins = props.highlights.map(
    (h) =>
      new api.AdvancedMarkerElement({
        map: map.value,
        position: h.position,
        content: highlightElement(h),
        title: h.label,
        zIndex: 6,
      }),
  )
  requestAnimationFrame(declutterHighlights)
}
/**
 * Feature labels are ~150px wide, so two points close together on a zoomed-out route overlap
 * (and can sit on the destination pin). Keep them in priority order and hide any label that
 * would collide on screen with a pin or an earlier label; re-checked whenever the map settles.
 */
function declutterHighlights() {
  const hit = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)
  const kept = [...pins.values()].map(({ element }) => element.getBoundingClientRect())
  for (const marker of highlightPins) {
    const el = marker.content
    if (!el) continue
    el.style.visibility = ''
    const box = el.getBoundingClientRect()
    if (!box.width) continue
    if (kept.some((k) => hit(k, box))) el.style.visibility = 'hidden'
    else kept.push(box)
  }
}
function syncAmenities() {
  amenityPins.forEach((marker) => (marker.map = null))
  amenityPins = []
  if (!map.value) return
  amenityPins = props.amenities.map(
    (amenity) =>
      new api.AdvancedMarkerElement({
        map: map.value,
        position: amenity.position,
        content: amenityElement(amenity),
        title: amenity.label,
        zIndex: 5,
      }),
  )
}

function syncMarker(current, position, className, title) {
  if (!position) {
    if (current) current.map = null
    return null
  }
  if (current) {
    current.position = position
    return current
  }
  return new api.AdvancedMarkerElement({ map: map.value, position, content: dotElement(className), title, zIndex: 20 })
}

function syncPeople() {
  if (!map.value) return
  const following = Boolean(props.follow) // the heading arrow replaces the dots
  userMarker = syncMarker(userMarker, following ? null : props.user, 'gm-user', t('map.yourLocation'))
  startMarker = syncMarker(startMarker, following || props.user ? null : props.start, 'gm-start', t('map.routeStart'))
}

// ---------- lifecycle ----------
onMounted(async () => {
  offAuthFailure = onGoogleMapsAuthFailure(() => emit('error', new Error('Google Maps key was rejected')))
  try {
    api = await loadGoogleMaps()
  } catch (error) {
    emit('error', error)
    return
  }
  if (!container.value) return

  // Reused, not created: Google maps can't be destroyed (services/googlePool.js)
  pooled = acquireMap(api, container.value, {
    center: HOBART_CENTRE,
    zoom: 15,
    mapId: MAP_ID,
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: props.interactive ? 'greedy' : 'none',
    // No keyboard-shortcuts button in the attribution bar; pins stay focusable and
    // every map screen has on-screen zoom / locate controls.
    keyboardShortcuts: false,
  }, { vector: Boolean(props.follow) })
  map.value = pooled.instance
  if (props.follow) mapListeners.push(map.value.addListener('renderingtype_changed', syncHeadingArrow)) // vector becomes ready
  mapListeners.push(map.value.addListener('idle', declutterHighlights))

  for (const site of props.sites) {
    const element = pinElement(site)
    const marker = new api.AdvancedMarkerElement({
      map: map.value,
      position: site.coordinates,
      content: element,
      title: site.name,
      gmpClickable: props.interactive,
    })
    if (props.interactive) marker.addEventListener('gmp-click', () => emit('select', site.id))
    if (props.previews) {
      // the hovered landmark (and its card) rises above its neighbours
      element.addEventListener('mouseenter', () => (marker.zIndex = 50))
      element.addEventListener('mouseleave', () => (marker.zIndex = site.id === props.selectedId ? 10 : 1))
    }
    pins.set(site.id, { marker, element })
  }

  syncPeople()
  syncSelection()
  syncAlternatives()
  syncRoute()
  syncAmenities()
  syncHighlights()
  recenter()
  emit('ready')
})

watch(() => props.selectedId, syncSelection)
watch(
  () => [props.follow?.position?.lat, props.follow?.position?.lng, props.follow?.heading],
  () => followCamera(),
)
watch(
  () => [props.routePath, props.realRoute, props.routeColor],
  () => {
    syncRoute()
    recenter()
  },
)
watch(() => props.amenities, syncAmenities)
watch(() => props.highlights, syncHighlights)
watch(() => props.alternatives, syncAlternatives)
watch(() => [props.user?.lat, props.user?.lng, props.start?.lat, props.start?.lng], syncPeople)

/** Run a teardown step without letting a Google-side failure (e.g. after an auth error) block unmounting. */
const safely = (fn) => {
  try {
    fn()
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[GoogleMap] cleanup skipped:', error?.message)
  }
}

onBeforeUnmount(() => {
  offAuthFailure()
  mapListeners.forEach((l) => safely(() => l.remove()))
  mapListeners = []
  safely(() => routeLine?.setMap(null))
  safely(() => userMarker && (userMarker.map = null))
  safely(() => startMarker && (startMarker.map = null))
  safely(() => headingMarker && (headingMarker.map = null))
  pins.forEach(({ marker }) => safely(() => (marker.map = null)))
  amenityPins.forEach((marker) => safely(() => (marker.map = null)))
  highlightPins.forEach((marker) => safely(() => (marker.map = null)))
  alternativeLines.forEach((line) => safely(() => line.setMap(null)))
  pins.clear()
  releaseMap(pooled) // back to the pool for the next map screen
  pooled = null
})

defineExpose({ recenter, focusUser, zoomIn: () => zoomBy(1), zoomOut: () => zoomBy(-1) })
</script>

<template>
  <div ref="container" class="google-map" role="application" :aria-label="t('map.ariaMap')" />
</template>

<style scoped>
.google-map {
  position: absolute;
  inset: 0;
  background: var(--map-land);
}
</style>

<!-- Marker DOM is created by Google Maps outside this component's scope, so these styles are global (prefixed gm-). -->
<style>
.gm-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.gm-pin::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 50%;
  width: var(--hit);
  height: var(--hit);
  transform: translateX(-50%); /* invisible 44×44 touch area around a smaller visual (Apple HIG minimum) */
}
.gm-pin__head {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50% 50% 50% 0;
  border: 2px solid var(--paper);
  background: var(--ink-900);
  box-shadow: var(--e-1);
  transform: rotate(-45deg);
  transition: transform var(--dur) var(--ease), background var(--dur) var(--ease);
}
.gm-pin__head b {
  transform: rotate(45deg);
  color: var(--cream);
  font: var(--t-label-sm);
  font-weight: 700;
}
.gm-pin__label {
  position: absolute;
  top: calc(100% + 6px);
  padding: 2px 7px;
  border-radius: var(--r-xs);
  background: var(--paper);
  color: var(--ink-900);
  font: var(--t-micro);
  font-weight: 700;
  white-space: nowrap;
  box-shadow: var(--e-1);
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
  pointer-events: none;
}
.gm-pin.is-selected .gm-pin__head {
  background: var(--brand-600);
  transform: rotate(-45deg) scale(1.2);
}
.gm-pin.is-selected .gm-pin__label {
  opacity: 1;
  transform: none;
}
.gm-pin__preview {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 3;
  width: 168px;
  padding: 6px;
  border-radius: var(--r-md);
  background: var(--paper);
  box-shadow: var(--e-2);
  opacity: 0;
  translate: -50% 0;
  scale: calc(1 - 0.12 * var(--motion));
  transform-origin: 50% 100%; /* grows out of the pin */
  filter: blur(calc(4px * var(--motion)));
  transition: opacity var(--dur-fast) var(--ease), scale var(--dur) var(--ease), filter var(--dur) var(--ease);
  pointer-events: none;
}
.gm-pin__preview img {
  display: block;
  width: 100%;
  height: 92px;
  object-fit: cover;
  border-radius: var(--r-sm);
  background: var(--sand);
}
.gm-pin__preview span {
  display: block;
  padding: 6px 4px 2px;
  font: var(--t-label);
  color: var(--ink-900);
  white-space: normal;
  text-align: center;
}
@media (hover: hover) {
  .gm-pin:hover .gm-pin__preview {
    opacity: 1;
    scale: 1;
    filter: none;
  }
  .gm-pin.has-preview:hover .gm-pin__label {
    opacity: 0; /* the card already names it */
  }
  .gm-pin:hover .gm-pin__label {
    opacity: 1;
    transform: none;
  }
}
.gm-amenity {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--ink-900);
  background: var(--paper);
  color: var(--ink-900);
  box-shadow: var(--e-1);
  transform: translateY(50%); /* centre the badge on the route point */
}
.gm-highlight {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px 3px 7px;
  border-radius: var(--r-pill);
  background: var(--ink-900);
  color: var(--cream);
  font: var(--t-micro);
  white-space: nowrap;
  box-shadow: var(--e-1);
  transform: translateY(50%); /* centre the chip on the route point */
}
.gm-user,
.gm-start {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid var(--paper);
  transform: translateY(50%); /* anchor the dot's centre on the position */
}
.gm-user {
  background: var(--info-600);
  box-shadow: 0 0 0 8px rgba(47, 111, 237, 0.2);
}
.gm-start {
  background: var(--ink-900);
  box-shadow: var(--e-1);
}
/* Walker with heading (AR navigation map): a blue arrow in a soft halo, pointing where they go */
.gm-heading {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(47, 111, 237, 0.16);
  transform: translateY(50%) rotate(var(--turn, 0deg));
}
.gm-heading::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 26px;
  background: var(--info-600);
  clip-path: polygon(50% 0, 100% 100%, 50% 76%, 0 100%);
  filter: drop-shadow(0 0 0 var(--paper));
  transform: translate(-50%, -55%);
}
</style>
