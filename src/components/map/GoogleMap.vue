<script setup>
/**
 * Google Map with heritage-site pins at their real coordinates, the walker's
 * live position and a route line to the selected site.
 * Emits `error` if the API can't load or the key is rejected, so the parent can
 * fall back to the illustrated map.
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { loadGoogleMaps, MAP_ID, onGoogleMapsAuthFailure } from '@/services/googleMaps'
import { HOBART_CENTRE } from '@/data/navigation'

const props = defineProps({
  sites: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  /** ROUTE_TYPES entry (uses `hex` + `dashed`). */
  routeType: { type: Object, required: true },
  /** Live walker position, or null when unknown / outside Hobart. */
  user: { type: Object, default: null },
  /** Where the route starts (walker if in Hobart, else city centre). */
  origin: { type: Object, required: true },
  /** Pixels of map hidden behind the bottom panel — keeps pins out from under it. */
  bottomInset: { type: Number, default: 0 },
})
const emit = defineEmits(['select', 'error', 'ready'])

const container = ref(null)
const map = shallowRef(null)
let api = null
let userMarker = null
let routeLine = null
const pins = new Map() // siteId → { marker, element }
let offAuthFailure = () => {}

const padding = () => ({ top: 96, right: 72, bottom: props.bottomInset + 32, left: 32 })

function pinElement(site) {
  const el = document.createElement('div')
  el.className = 'gm-pin'
  const head = document.createElement('span')
  head.className = 'gm-pin__head'
  const num = document.createElement('b')
  num.textContent = String(site.id)
  head.append(num)
  const label = document.createElement('span')
  label.className = 'gm-pin__label'
  label.textContent = site.shortName
  el.append(head, label)
  return el
}

function userElement() {
  const el = document.createElement('div')
  el.className = 'gm-user'
  return el
}

function fitTo(points) {
  if (!map.value || !points.length) return
  if (points.length === 1) {
    map.value.panTo(points[0])
    return
  }
  const bounds = new api.LatLngBounds()
  points.forEach((p) => bounds.extend(p))
  map.value.fitBounds(bounds, padding())
}

/** Frame every site (and the walker, when in Hobart). */
function showAll() {
  fitTo([...props.sites.map((s) => s.coordinates), ...(props.user ? [props.user] : [])])
}

/** Centre on the walker (used by the "my location" button). */
function focusUser() {
  if (!map.value || !props.user) return
  map.value.panTo(props.user)
  if (map.value.getZoom() < 16) map.value.setZoom(16)
}

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
  const site = props.sites.find((s) => s.id === props.selectedId)
  if (!site || !map.value) return

  const { hex, dashed } = props.routeType
  routeLine = new api.Polyline({
    map: map.value,
    path: [props.origin, site.coordinates],
    geodesic: true,
    strokeColor: hex,
    strokeWeight: 4,
    strokeOpacity: dashed ? 0 : 0.9,
    icons: dashed
      ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: hex, scale: 3 }, offset: '0', repeat: '12px' }]
      : [],
  })
  fitTo([props.origin, site.coordinates])
}

function syncUser() {
  if (!map.value) return
  if (!props.user) {
    if (userMarker) userMarker.map = null
    userMarker = null
    return
  }
  if (!userMarker) {
    userMarker = new api.AdvancedMarkerElement({ map: map.value, position: props.user, content: userElement(), title: 'Your location', zIndex: 20 })
  } else {
    userMarker.position = props.user
  }
}

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
    gestureHandling: 'greedy',
  })

  for (const site of props.sites) {
    const element = pinElement(site)
    const marker = new api.AdvancedMarkerElement({
      map: map.value,
      position: site.coordinates,
      content: element,
      title: site.name,
      gmpClickable: true,
    })
    marker.addListener('click', () => emit('select', site.id))
    pins.set(site.id, { marker, element })
  }

  syncUser()
  syncSelection()
  if (props.selectedId) syncRoute()
  else showAll()
  emit('ready')
})

watch(() => props.selectedId, (id) => {
  syncSelection()
  syncRoute()
  if (!id) showAll()
})
watch(() => [props.routeType.key, props.origin.lat, props.origin.lng], syncRoute)
watch(() => props.user && [props.user.lat, props.user.lng], syncUser)

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
  pins.forEach(({ marker }) => safely(() => (marker.map = null)))
  pins.clear()
})

defineExpose({ showAll, focusUser })
</script>

<template>
  <div ref="container" class="google-map" role="application" aria-label="Map of Hobart heritage sites" />
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
.gm-user {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid var(--paper);
  background: var(--info-600);
  box-shadow: 0 0 0 8px rgba(47, 111, 237, 0.2);
  transform: translateY(50%); /* anchor the dot's centre on the position */
}
</style>
