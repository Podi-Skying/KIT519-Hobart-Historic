<script setup>
/**
 * Illustrated fallback map (used when Google Maps isn't configured or fails):
 * numbered site pins, the walker's position and the planned route line.
 * Positions are percentages of the canvas, projected from real coordinates.
 */
import { computed } from 'vue'
import MapBackdrop from './MapBackdrop.vue'

const props = defineProps({
  sites: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  /** ROUTE_TYPES entry used to style the route line. */
  routeType: { type: Object, required: true },
  /** Walker position on the canvas (%), or null when outside the mapped area. */
  userPosition: { type: Object, default: null },
  /** Where the route line starts (%): the walker, or the city centre. */
  originPosition: { type: Object, required: true },
})
const emit = defineEmits(['select'])

const selected = computed(() => props.sites.find((s) => s.id === props.selectedId) ?? null)
</script>

<template>
  <div class="map-canvas">
    <MapBackdrop />

    <svg v-if="selected" class="map-canvas__route" aria-hidden="true">
      <line
        :x1="`${originPosition.x}%`"
        :y1="`${originPosition.y}%`"
        :x2="`${selected.mapPosition.x}%`"
        :y2="`${selected.mapPosition.y}%`"
        :stroke="routeType.color"
        stroke-width="4"
        stroke-linecap="round"
        :stroke-dasharray="routeType.dashed ? '2 8' : undefined"
      />
    </svg>

    <span
      v-if="userPosition"
      class="map-canvas__user"
      :style="{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }"
      role="img"
      aria-label="Your location"
    />

    <button
      v-for="site in sites"
      :key="site.id"
      type="button"
      class="pin"
      :class="{ 'is-selected': site.id === selectedId }"
      :style="{ left: `${site.mapPosition.x}%`, top: `${site.mapPosition.y}%` }"
      :aria-label="site.name"
      :aria-pressed="site.id === selectedId"
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
.map-canvas__user {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid var(--paper);
  background: var(--info-600);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 8px rgba(47, 111, 237, 0.18);
}
.pin {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -100%);
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
