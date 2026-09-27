<script>
/** Module scope: the motion hint shows once per session, across both AR screens. */
let motionHintShown = false
</script>

<script setup>
/**
 * 360° Street View (Google Maps JavaScript API › StreetViewPanorama).
 * Finds the nearest outdoor panorama to `at` and opens it turned towards `target`:
 *  - AR camera: at = target = the landmark (look at the building)
 *  - AR navigation: at = the walker, target = a point ~40 m ahead on the route (look where to go);
 *    as the walker moves, the same panorama object switches to the next nearby panorama
 *    (setPano — no new Street View load).
 * Drag to look around; on phones, motion tracking turns the view with the phone. Google's own
 * motion control is replaced by an app-styled toggle (bottom right), which also asks iOS.
 * Google's terms: imagery is never downloaded or cached, and the Google logo/attribution at the
 * bottom stays visible — parents keep their own bottom UI off it (see ArNavigationView).
 * Emits `ready` once the panorama shows, `unavailable` if there is no key, no panorama or an error.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import { hasMotionPermission, requestMotionPermission } from '@/composables/useLookAround'
import { loadStreetView, onGoogleMapsAuthFailure } from '@/services/googleMaps'
import { acquirePanorama, releasePanorama } from '@/services/googlePool'
import { LANDMARK_PITCH, PANO_FOLLOW_METERS, PANO_SEARCH_RADIUS_M, facingPov } from '@/lib/streetView'
import { distanceKm } from '@/lib/geo'

const props = defineProps({
  /** What the view turns towards, { lat, lng } */
  target: { type: Object, required: true },
  /** Where to look for a panorama (default: at the target itself) */
  at: { type: Object, default: null },
  /** Search radius in metres */
  radius: { type: Number, default: PANO_SEARCH_RADIUS_M },
  /** False while the parent keeps it mounted but hidden: the gyro stops driving it. */
  active: { type: Boolean, default: true },
  /** Camera tilt: up at a building, level down a street */
  pitch: { type: Number, default: LANDMARK_PITCH },
})
const emit = defineEmits(['ready', 'unavailable', 'lost'])

const { t } = useI18n()
const el = ref(null)
let panorama = null
/** pooled { element, instance } — panoramas can't be destroyed, so they're reused */
let pooled = null
let sv = null
let service = null
let searchedAt = null
let currentPano = null

// ---- motion tracking (turn the phone to look around) ----
/** Phones/tablets with a gyro; a desktop mouse has nothing to track. */
const canMotion =
  typeof window !== 'undefined' &&
  'DeviceOrientationEvent' in window &&
  window.matchMedia?.('(pointer: coarse)').matches
const motion = ref(false)
/** Hidden until the panorama is on screen: whatever is underneath stays visible while it loads. */
const ready = ref(false)
/** First time only: name the motion toggle beside it for a moment (then the icon alone). */
const motionHint = ref(false)
let hintTimer
function setMotion(on) {
  motion.value = on
  panorama?.setMotionTracking(on)
}
async function toggleMotion() {
  if (motion.value) return setMotion(false)
  if (await requestMotionPermission()) setMotion(true) // iOS prompts here, inside the tap
}
let alive = true
let broken = false
function onContextLost(e) {
  e.preventDefault()
  if (broken) return
  broken = true
  emit('lost')
}
const stopAuthWatch = onGoogleMapsAuthFailure(() => emit('unavailable'))

const searchPoint = () => props.at ?? props.target

/** Nearest outdoor panorama to `point` → { pano, position } (rejects when there is none). */
async function nearestPano(point) {
  const { data } = await service.getPanorama({
    location: point,
    radius: props.radius,
    preference: sv.StreetViewPreference.NEAREST,
    sources: [sv.StreetViewSource.OUTDOOR],
  })
  if (!data?.location?.pano) throw new Error('No panorama nearby')
  const ll = data.location.latLng
  return { pano: data.location.pano, position: { lat: ll.lat(), lng: ll.lng() } }
}

onMounted(async () => {
  try {
    sv = await loadStreetView()
    service = new sv.StreetViewService()
    searchedAt = { ...searchPoint() }
    const found = await nearestPano(searchedAt)
    if (!alive || !el.value) return
    currentPano = found.pano
    pooled = acquirePanorama(sv, el.value, {
      pano: found.pano,
      pov: facingPov(found.position, props.target, props.pitch),
      zoom: 0,
      // keep the view clean: the app's own chrome sits on top
      addressControl: false,
      fullscreenControl: false,
      enableCloseButton: false,
      linksControl: false,
      panControl: false,
      zoomControl: false,
      showRoadLabels: false,
      keyboardShortcuts: false, // no "Keyboard shortcuts" button in the attribution strip (touch app)
      clickToGo: false, // the app moves the view (with the walker), not taps
      // on by default where no prompt is needed (Android, or iOS after an earlier grant)
      motionTracking: canMotion && hasMotionPermission(),
      motionTrackingControl: false, // replaced by the toggle below
    })
    panorama = pooled.instance
    // iPhones can drop the panorama's GPU context under memory pressure (it would freeze on a
    // black frame). Throw that instance away and let the parent mount a fresh one.
    pooled.element.addEventListener('webglcontextlost', onContextLost, true)
    panorama.setPano(found.pano) // a reused panorama keeps its last scene until told otherwise
    panorama.setPov(facingPov(found.position, props.target, props.pitch))
    motion.value = panorama.getMotionTracking?.() ?? false
    ready.value = true
    if (canMotion && !motionHintShown) {
      motionHintShown = true
      motionHint.value = true
      hintTimer = setTimeout(() => (motionHint.value = false), 3000)
    }
    emit('ready')
  } catch {
    if (alive) emit('unavailable') // no key, no panorama nearby (ZERO_RESULTS) or network error
  }
})

// Walking: once the walker is PANO_FOLLOW_METERS from the last search, hop to the panorama
// nearest them (metadata lookups are free) and face the route again. No panorama there → stay.
watch(
  () => (props.at ? [props.at.lat, props.at.lng] : null),
  async () => {
    if (!panorama || !props.at || !searchedAt) return
    if (distanceKm(searchedAt, props.at) * 1000 < PANO_FOLLOW_METERS) return
    searchedAt = { ...props.at }
    try {
      const found = await nearestPano(searchedAt)
      if (!alive || !panorama || found.pano === currentPano) return
      currentPano = found.pano
      panorama.setPano(found.pano)
      if (!motion.value) panorama.setPov(facingPov(found.position, props.target, props.pitch)) // the phone steers when tracking
    } catch {
      /* keep showing the last panorama */
    }
  },
)

// Hidden but kept (AR camera toggle): stop motion tracking so the gyro isn't read for nothing.
watch(
  () => props.active,
  (on) => {
    if (!on && motion.value) setMotion(false)
  },
)

// Leaving: stop listening, stop the gyro and park the panorama for the next 360° view.
onBeforeUnmount(() => {
  alive = false
  clearTimeout(hintTimer)
  stopAuthWatch()
  pooled?.element.removeEventListener('webglcontextlost', onContextLost, true)
  releasePanorama(pooled, { discard: broken })
  pooled = null
  panorama = null
})
</script>

<template>
  <div class="street-view" :class="{ 'is-ready': ready }">
    <div ref="el" class="street-view__pano" />
    <Transition name="hint">
      <span v-if="motionHint" class="street-view__hint" aria-hidden="true">{{ t('ar.motion') }}</span>
    </Transition>
    <IconButton
      v-if="canMotion"
      class="street-view__motion"
      variant="glass"
      icon="phoneMotion"
      :label="t('ar.motion')"
      :pressed="motion"
      @click="toggleMotion"
    />
  </div>
</template>

<style scoped>
.street-view,
.street-view__pano {
  position: absolute;
  inset: 0;
}
.street-view {
  z-index: 1; /* own stacking context: Google's high z-indexes stay under the app's top bar */
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--dur-page) var(--ease);
}
.street-view.is-ready {
  opacity: 1; /* fades in over the photo — materializes instead of popping */
  pointer-events: auto;
  background: var(--camera-bg);
}
.street-view__pano {
  z-index: 0;
}
/* Same glass button as the AR top bar; pressed = motion on (charcoal, like other toggles) */
.street-view__motion {
  position: absolute;
  right: var(--gutter);
  bottom: calc(var(--safe-bottom) + var(--s-6));
  z-index: 1;
}
.street-view__hint {
  position: absolute;
  right: calc(var(--gutter) + var(--hit) + var(--s-2));
  bottom: calc(var(--safe-bottom) + var(--s-6) + 7px);
  z-index: 1;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  background: var(--glass);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  color: var(--cream);
  font: var(--t-label-sm);
  white-space: nowrap;
  pointer-events: none;
}
.hint-enter-active,
.hint-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translateX(calc(8px * var(--motion))); /* grows out of / back into the button */
}
</style>
