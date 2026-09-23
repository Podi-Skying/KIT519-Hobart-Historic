<script setup>
/**
 * Illustrated fallback map (used when Google Maps isn't configured or fails):
 * numbered site pins, the walker / route start, and the route path — all
 * projected from real coordinates into the `box` area of the illustration.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MapBackdrop from './MapBackdrop.vue'
import { FALLBACK_MAP_BOX, SITE_BOUNDS } from '@/data/sites'
import { boundsOf, projectToBox } from '@/lib/geo'

const props = defineProps({
  sites: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  routePath: { type: Array, default: () => [] },
  /** CSS colour (token) for the route line. */
  routeColor: { type: String, default: 'var(--brand-600)' },
  realRoute: { type: Boolean, default: false },
  user: { type: Object, default: null },
  start: { type: Object, default: null },
  /** 'all' = Hobart overview; 'route' = zoomed to the route. */
  fit: { type: String, default: 'all' },
  /** Percent area of the canvas that pins may occupy (avoid overlays). */
  box: { type: Object, default: () => FALLBACK_MAP_BOX },
  interactive: { type: Boolean, default: true },
})
const emit = defineEmits(['select'])
const { t } = useI18n()

const bounds = computed(() =>
  props.fit === 'route' && props.routePath.length > 1 ? boundsOf(props.routePath, 0.15) : SITE_BOUNDS,
)
const project = (p) => (p ? projectToBox(p, bounds.value, props.box) : null)

const pins = computed(() => props.sites.map((site) => ({ site, pos: project(site.coordinates) })).filter((p) => p.pos))
const userPos = computed(() => project(props.user))
const startPos = computed(() => (props.user ? null : project(props.start)))
const routePoints = computed(() =>
  props.routePath
    .map(project)
    .filter(Boolean)
    .map((p) => `${p.x},${p.y}`)
    .join(' '),
)

// No-op camera controls so parents can call the same API as GoogleMap.
defineExpose({ recenter() {}, focusUser() {}, zoomIn() {}, zoomOut() {} })
</script>

<template>
  <div class="map-canvas">
    <MapBackdrop />

    <svg v-if="routePoints" class="map-canvas__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        :points="routePoints"
        fill="none"
        :stroke="routeColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
        :stroke-dasharray="realRoute ? undefined : '2 8'"
      />
    </svg>

    <span v-if="userPos" class="map-canvas__dot map-canvas__dot--user" :style="{ left: `${userPos.x}%`, top: `${userPos.y}%` }" role="img" :aria-label="t('map.yourLocation')" />
    <span v-if="startPos" class="map-canvas__dot map-canvas__dot--start" :style="{ left: `${startPos.x}%`, top: `${startPos.y}%` }" role="img" :aria-label="t('map.routeStart')" />

    <button
      v-for="{ site, pos } in pins"
      :key="site.id"
      type="button"
      class="pin"
      :class="{ 'is-selected': site.id === selectedId }"
      :style="{ left: `${pos.x}%`, top: `${pos.y}%` }"
      :aria-label="site.name"
      :aria-pressed="site.id === selectedId"
      :disabled="!interactive"
      @click="emit('select', site.id)"
    >
      <span class="pin__head"><b>{{ site.id }}</b></span>
      <span v-if="site.id === selectedId" class="pin__label">{{ site.shortName }}</span>
    </button>
  </div>
</template>

<style scoped>
.map-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--map-land);
}
.map-canvas__route {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.map-canvas__dot {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid var(--paper);
  transform: translate(-50%, -50%);
}
.map-canvas__dot--user {
  background: var(--info-600);
  box-shadow: 0 0 0 8px rgba(47, 111, 237, 0.18);
}
.map-canvas__dot--start {
  background: var(--ink-900);
}
.pin {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -100%);
}
.pin:disabled {
  cursor: default;
}
.pin__head {
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
.pin__head b {
  transform: rotate(45deg);
  color: var(--cream);
  font: 700 12px var(--font-label);
}
.pin.is-selected .pin__head {
  background: var(--brand-600);
  transform: rotate(-45deg) scale(1.2);
}
.pin__label {
  position: absolute;
  top: calc(100% + 6px);
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--paper);
  color: var(--ink-900);
  font: 700 10px var(--font-label);
  white-space: nowrap;
  box-shadow: var(--e-1);
}
</style>
