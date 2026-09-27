<script setup>
/**
 * Illustrated fallback map (used when Google Maps isn't configured or fails):
 * numbered site pins, the walker / route start, and the route path — all
 * projected from real coordinates into the `box` area of the illustration.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MapBackdrop from './MapBackdrop.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { FALLBACK_MAP_BOX, SITE_BOUNDS } from '@/data/sites'
import { boundsOf, projectToBox } from '@/lib/geo'

const props = defineProps({
  sites: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  routePath: { type: Array, default: () => [] },
  /** CSS colour (token) for the route line. */
  routeColor: { type: String, default: 'var(--brand-600)' },
  realRoute: { type: Boolean, default: false },
  /** Amenity stops on the route: { id, icon, label, position }. */
  amenities: { type: Array, default: () => [] },
  /** Labelled route feature points: { id, icon, label, position }. */
  highlights: { type: Array, default: () => [] },
  /** Other route types, drawn faint and tappable: { key, path, color, label }. */
  alternatives: { type: Array, default: () => [] },
  user: { type: Object, default: null },
  start: { type: Object, default: null },
  /** 'all' = Hobart overview; 'route' = zoomed to the route. */
  fit: { type: String, default: 'all' },
  /** Percent area of the canvas that pins may occupy (avoid overlays). */
  box: { type: Object, default: () => FALLBACK_MAP_BOX },
  interactive: { type: Boolean, default: true },
  /** Map tab: hovering (or focusing) a landmark pops up its photo and name above the pin. */
  previews: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'select-route'])
const { t } = useI18n()

const bounds = computed(() =>
  props.fit === 'route' && props.routePath.length > 1 ? boundsOf(props.routePath, 0.15) : SITE_BOUNDS,
)
const project = (p) => (p ? projectToBox(p, bounds.value, props.box) : null)

const pins = computed(() => props.sites.map((site) => ({ site, pos: project(site.coordinates) })).filter((p) => p.pos))
const amenityPins = computed(() =>
  props.amenities.map((amenity) => ({ amenity, pos: project(amenity.position) })).filter((p) => p.pos),
)
const highlightPins = computed(() =>
  props.highlights.map((h) => ({ h, pos: project(h.position) })).filter((p) => p.pos),
)
const pointsOf = (path) =>
  path
    .map(project)
    .filter(Boolean)
    .map((p) => `${p.x},${p.y}`)
    .join(' ')
const alternativeLines = computed(() => props.alternatives.map((alt) => ({ ...alt, points: pointsOf(alt.path) })))
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
      <!-- other route types, faint; tap to switch -->
      <polyline
        v-for="alt in alternativeLines"
        :key="alt.key"
        class="map-canvas__alt"
        :points="alt.points"
        fill="none"
        :stroke="alt.color"
        stroke-width="10"
        stroke-opacity="0.001"
        vector-effect="non-scaling-stroke"
        @click="interactive && emit('select-route', alt.key)"
      />
      <polyline
        v-for="alt in alternativeLines"
        :key="`${alt.key}-line`"
        :points="alt.points"
        fill="none"
        :stroke="alt.color"
        stroke-opacity="0.4"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
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

    <span
      v-for="{ amenity, pos } in amenityPins"
      :key="amenity.id"
      class="map-canvas__amenity"
      :style="{ left: `${pos.x}%`, top: `${pos.y}%` }"
      role="img"
      :aria-label="amenity.label"
      :title="amenity.label"
    >
      <AppIcon :name="amenity.icon" :size="16" />
    </span>

    <span
      v-for="{ h, pos } in highlightPins"
      :key="h.id"
      class="map-canvas__highlight"
      :style="{ left: `${pos.x}%`, top: `${pos.y}%` }"
      role="img"
      :aria-label="h.label"
    >
      <AppIcon :name="h.icon" :size="14" :stroke-width="2.2" />{{ h.label }}
    </span>

    <span v-if="userPos" class="map-canvas__dot map-canvas__dot--user" :style="{ left: `${userPos.x}%`, top: `${userPos.y}%` }" role="img" :aria-label="t('map.yourLocation')" />
    <span v-if="startPos" class="map-canvas__dot map-canvas__dot--start" :style="{ left: `${startPos.x}%`, top: `${startPos.y}%` }" role="img" :aria-label="t('map.routeStart')" />

    <button
      v-for="{ site, pos } in pins"
      :key="site.id"
      type="button"
      class="pin pressable"
      :class="{ 'is-selected': site.id === selectedId }"
      :style="{ left: `${pos.x}%`, top: `${pos.y}%` }"
      :aria-label="site.name"
      :aria-pressed="site.id === selectedId"
      :disabled="!interactive"
      @click="emit('select', site.id)"
    >
      <span v-if="previews" class="pin__preview" aria-hidden="true">
        <img :src="site.image" alt="" loading="lazy" decoding="async" />
        <span>{{ site.name }}</span>
      </span>
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
.map-canvas__alt {
  pointer-events: stroke;
  cursor: pointer;
}
.map-canvas__highlight {
  position: absolute;
  z-index: 1;
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
  transform: translate(-50%, -50%);
}
.map-canvas__amenity {
  position: absolute;
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
.pin::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 50%;
  width: var(--hit);
  height: var(--hit);
  transform: translateX(-50%); /* invisible 44×44 touch area around a smaller visual (Apple HIG minimum) */
}
.pin__preview {
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
.pin__preview img {
  display: block;
  width: 100%;
  height: 92px;
  object-fit: cover;
  border-radius: var(--r-sm);
  background: var(--sand);
}
.pin__preview span {
  display: block;
  padding: 6px 4px 2px;
  font: var(--t-label);
  color: var(--ink-900);
  text-align: center;
}
.pin:focus-visible .pin__preview {
  opacity: 1;
  scale: 1;
  filter: none;
}
@media (hover: hover) {
  .pin:hover {
    z-index: 5;
  }
  .pin:hover .pin__preview {
    opacity: 1;
    scale: 1;
    filter: none;
  }
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
  font: var(--t-label-sm);
  font-weight: 700;
}
.pin.is-selected .pin__head {
  background: var(--brand-600);
  transform: rotate(-45deg) scale(1.2);
}
.pin__label {
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
}
</style>
