<script setup>
/**
 * 360° Street View of a landmark (Google Maps JavaScript API › StreetViewPanorama).
 * Finds the nearest outdoor panorama within PANO_SEARCH_RADIUS_M of the landmark and opens it
 * turned towards the building. Drag to look around; on phones, motion tracking turns the view
 * with the phone (Google's own control asks iOS for motion permission).
 * Google's terms: imagery is never downloaded or cached, and the Google attribution stays visible.
 * Emits `ready` once the panorama shows, `unavailable` if there is no key, no panorama or an error.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { loadStreetView, onGoogleMapsAuthFailure } from '@/services/googleMaps'
import { PANO_SEARCH_RADIUS_M, facingPov } from '@/lib/streetView'

const props = defineProps({
  /** The landmark, { lat, lng } */
  target: { type: Object, required: true },
})
const emit = defineEmits(['ready', 'unavailable'])

const el = ref(null)
let panorama = null
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
      motionTracking: true,
      motionTrackingControl: true,
    })
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
  <div ref="el" class="street-view" />
</template>

<style scoped>
.street-view {
  position: absolute;
  inset: 0;
  z-index: 1; /* own stacking context: Google's high z-indexes stay under the app's top bar */
  background: var(--ink-900);
}
</style>
