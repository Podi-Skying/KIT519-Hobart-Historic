<script setup>
/**
 * 360° Street View of a landmark (Google Maps JavaScript API › StreetViewPanorama).
 * Finds the nearest outdoor panorama within PANO_SEARCH_RADIUS_M of the landmark and opens it
 * turned towards the building. Drag to look around; on phones, motion tracking turns the view
 * with the phone. Google's own motion control is replaced by an app-styled toggle (bottom right),
 * which also asks iOS for motion permission.
 * Google's terms: imagery is never downloaded or cached, and the Google attribution stays visible.
 * Emits `ready` once the panorama shows, `unavailable` if there is no key, no panorama or an error.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import { hasMotionPermission, requestMotionPermission } from '@/composables/useLookAround'
import { loadStreetView, onGoogleMapsAuthFailure } from '@/services/googleMaps'
import { PANO_SEARCH_RADIUS_M, facingPov } from '@/lib/streetView'

const props = defineProps({
  /** The landmark, { lat, lng } */
  target: { type: Object, required: true },
})
const emit = defineEmits(['ready', 'unavailable'])

const { t } = useI18n()
const el = ref(null)
let panorama = null

// ---- motion tracking (turn the phone to look around) ----
/** Phones/tablets with a gyro; a desktop mouse has nothing to track. */
const canMotion =
  typeof window !== 'undefined' &&
  'DeviceOrientationEvent' in window &&
  window.matchMedia?.('(pointer: coarse)').matches
const motion = ref(false)
/** Hidden until the panorama is on screen: the AR photo stays visible underneath while it loads. */
const ready = ref(false)
function setMotion(on) {
  motion.value = on
  panorama?.setMotionTracking(on)
}
async function toggleMotion() {
  if (motion.value) return setMotion(false)
  if (await requestMotionPermission()) setMotion(true) // iOS prompts here, inside the tap
}
let alive = true
const stopAuthWatch = onGoogleMapsAuthFailure(() => emit('unavailable'))

onMounted(async () => {
  try {
    const sv = await loadStreetView()
    const { data } = await new sv.StreetViewService().getPanorama({
      location: props.target,
      radius: PANO_SEARCH_RADIUS_M,
      preference: sv.StreetViewPreference.NEAREST,
      sources: [sv.StreetViewSource.OUTDOOR],
    })
    if (!alive || !el.value) return
    if (!data?.location?.pano) throw new Error('No panorama nearby')
    const at = data.location.latLng
    panorama = new sv.StreetViewPanorama(el.value, {
      pano: data.location.pano,
      pov: facingPov({ lat: at.lat(), lng: at.lng() }, props.target),
      zoom: 0,
      // keep the view clean: the app's own chrome sits on top
      addressControl: false,
      fullscreenControl: false,
      enableCloseButton: false,
      linksControl: false,
      panControl: false,
      zoomControl: false,
      showRoadLabels: false,
      clickToGo: false, // stay at the landmark
      // on by default where no prompt is needed (Android, or iOS after an earlier grant)
      motionTracking: canMotion && hasMotionPermission(),
      motionTrackingControl: false, // replaced by the toggle below
    })
    motion.value = panorama.getMotionTracking?.() ?? false
    ready.value = true
    emit('ready')
  } catch {
    if (alive) emit('unavailable') // no key, no panorama nearby (ZERO_RESULTS) or network error
  }
})

onBeforeUnmount(() => {
  alive = false
  stopAuthWatch()
  panorama?.setVisible(false)
  panorama = null
})
</script>

<template>
  <div class="street-view" :class="{ 'is-ready': ready }">
    <div ref="el" class="street-view__pano" />
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
</style>
