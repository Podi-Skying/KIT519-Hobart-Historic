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
import { HOBART_CENTRE } from '@/data/navigation'
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
  /** Live walker position (blue dot), or null. */
  user: { type: Object, default: null },
  /** Route start marker, shown when there is no live walker position. */
  start: { type: Object, default: null },
  /** 'all' frames every pin (+ walker); 'route' frames the route. */
  fit: { type: String, default: 'all', validator: (v) => ['all', 'route'].includes(v) },
  interactive: { type: Boolean, default: true },
  showLabels: { type: Boolean, default: true },
  /** Map padding (px) around fitted content — keep pins clear of overlays. */
  padding: { type: Object, default: () => ({ top: 96, right: 72, bottom: 32, left: 32 }) },
})
const emit = defineEmits(['select', 'error', 'ready'])

const { t } = useI18n()
const container = ref(null)
const map = shallowRef(null)
let api = null
let userMarker = null
let startMarker = null
let routeLine = null
const pins = new Map() // siteId → { marker, element }
let amenityPins = []
let offAuthFailure = () => {}

// ---------- marker DOM ----------
function pinElement(site) {
  const el = document.createElement('div')
  el.className = 'gm-pin'
  const head = document.createElement('span')
  head.className = 'gm-pin__head'
  const num = document.createElement('b')
  num.textContent = String(site.id)
  head.append(num)
  el.append(head)
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

/** Frame according to `fit`. */
function recenter() {
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
    icons: props.realRoute
      ? []
      : [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: color, scale: 3 }, offset: '0', repeat: '12px' }],
  })
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
  userMarker = syncMarker(userMarker, props.user, 'gm-user', t('map.yourLocation'))
  startMarker = syncMarker(startMarker, props.user ? null : props.start, 'gm-start', t('map.routeStart'))
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

  map.value = new api.Map(container.value, {
    center: HOBART_CENTRE,
    zoom: 15,
    mapId: MAP_ID,
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: props.interactive ? 'greedy' : 'none',
    keyboardShortcuts: props.interactive,
  })

  for (const site of props.sites) {
    const element = pinElement(site)
    const marker = new api.AdvancedMarkerElement({
      map: map.value,
      position: site.coordinates,
      content: element,
      title: site.name,
      gmpClickable: props.interactive,
    })
    if (props.interactive) marker.addListener('click', () => emit('select', site.id))
    pins.set(site.id, { marker, element })
  }

  syncPeople()
  syncSelection()
  syncRoute()
  syncAmenities()
  recenter()
  emit('ready')
})

watch(() => props.selectedId, syncSelection)
watch(
  () => [props.routePath, props.realRoute, props.routeColor],
  () => {
    syncRoute()
    recenter()
  },
)
watch(() => props.amenities, syncAmenities)
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
  safely(() => routeLine?.setMap(null))
  safely(() => userMarker && (userMarker.map = null))
  safely(() => startMarker && (startMarker.map = null))
  pins.forEach(({ marker }) => safely(() => (marker.map = null)))
  amenityPins.forEach((marker) => safely(() => (marker.map = null)))
  pins.clear()
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
  font: 700 12px var(--font-label);
}
.gm-pin__label {
  position: absolute;
  top: calc(100% + 6px);
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--paper);
  color: var(--ink-900);
  font: 700 10px var(--font-label);
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
.gm-pin.is-selected .gm-pin__label,
.gm-pin:hover .gm-pin__label {
  opacity: 1;
  transform: none;
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
</style>
