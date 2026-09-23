<script setup>
/**
 * The one map component screens use. Renders Google Maps when a key is
 * configured, and switches to the illustrated MapCanvas if it isn't (or if the
 * key is rejected). Both accept the same props and expose the same controls:
 * recenter(), focusUser(), zoomIn(), zoomOut().
 */
import { ref } from 'vue'
import GoogleMap from './GoogleMap.vue'
import MapCanvas from './MapCanvas.vue'
import { isGoogleMapsConfigured } from '@/services/googleMaps'

defineProps({
  sites: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  routePath: { type: Array, default: () => [] },
  /** ROUTE_TYPES entry: `hex` for Google, `color` (token) for the illustration. */
  routeType: { type: Object, required: true },
  realRoute: { type: Boolean, default: false },
  user: { type: Object, default: null },
  start: { type: Object, default: null },
  fit: { type: String, default: 'all' },
  interactive: { type: Boolean, default: true },
  showLabels: { type: Boolean, default: true },
  /** Google Maps fit padding (px). */
  padding: { type: Object, default: undefined },
  /** Illustration: percent area pins may occupy. */
  box: { type: Object, default: undefined },
})
const emit = defineEmits(['select'])

const useGoogle = ref(isGoogleMapsConfigured())
const inner = ref(null)

function fallBack(error) {
  if (import.meta.env.DEV) console.warn('[SiteMap] Google Maps unavailable, using illustrated map:', error?.message)
  useGoogle.value = false
}

defineExpose({
  recenter: () => inner.value?.recenter(),
  focusUser: () => inner.value?.focusUser(),
  zoomIn: () => inner.value?.zoomIn(),
  zoomOut: () => inner.value?.zoomOut(),
  isGoogle: () => useGoogle.value,
})
</script>

<template>
  <GoogleMap
    v-if="useGoogle"
    ref="inner"
    :sites="sites"
    :selected-id="selectedId"
    :route-path="routePath"
    :route-color="routeType.hex"
    :real-route="realRoute"
    :user="user"
    :start="start"
    :fit="fit"
    :interactive="interactive"
    :show-labels="showLabels"
    v-bind="padding ? { padding } : {}"
    @select="(id) => emit('select', id)"
    @error="fallBack"
  />
  <MapCanvas
    v-else
    ref="inner"
    :sites="sites"
    :selected-id="selectedId"
    :route-path="routePath"
    :route-color="routeType.color"
    :real-route="realRoute"
    :user="user"
    :start="start"
    :fit="fit"
    :interactive="interactive"
    v-bind="box ? { box } : {}"
    @select="(id) => emit('select', id)"
  />
</template>
