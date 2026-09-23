<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import MapBackdrop from '@/components/map/MapBackdrop.vue'
import { getSiteById } from '@/data/sites'
import { formatKm, pluralize } from '@/lib/format'
import { useTripStore } from '@/stores/trip'
import { useLocationStore } from '@/stores/location'

const props = defineProps({
  id: { type: Number, required: true },
})

const ZOOM = { min: 0.8, max: 1.8, step: 0.2, initial: 1 }
// Illustrative route in MapBackdrop's 390×520 coordinate space.
const START = { x: 175, y: 380 }
const DESTINATION = { x: 250, y: 150 }
const ROUTE_PATH = `M${START.x} ${START.y} C185 330 200 290 212 262 S238 190 ${DESTINATION.x} ${DESTINATION.y}`

const router = useRouter()
const trip = useTripStore()
const location = useLocationStore()
const site = computed(() => getSiteById(props.id))
const zoom = ref(ZOOM.initial)

const zoomBy = (delta) => {
  zoom.value = Math.min(ZOOM.max, Math.max(ZOOM.min, +(zoom.value + delta).toFixed(1)))
}
const recenter = () => (zoom.value = ZOOM.initial)
const endRoute = () => router.push({ name: 'map' })
</script>

<template>
  <div class="nav-view">
    <div class="nav-view__map" :style="{ transform: `scale(${zoom})` }">
      <MapBackdrop>
        <!-- Route kept inside the visible band (between the instruction card and the summary sheet) -->
        <path :d="ROUTE_PATH" stroke="var(--brand-600)" stroke-width="6" fill="none" stroke-linecap="round" />
        <circle :cx="DESTINATION.x" :cy="DESTINATION.y" r="9" fill="var(--brand-600)" stroke="var(--paper)" stroke-width="3" />
        <circle :cx="START.x" :cy="START.y" r="9" fill="var(--info-600)" stroke="var(--paper)" stroke-width="3" />
      </MapBackdrop>
    </div>

    <div class="instruction" role="status">
      <span class="instruction__icon"><AppIcon name="turnLeft" :size="24" /></span>
      <div>
        <p class="instruction__title">Turn left in 120 m</p>
        <p class="instruction__sub">onto Davey St</p>
      </div>
    </div>

    <div class="zoom">
      <IconButton variant="float" icon="plus" label="Zoom in" @click="zoomBy(ZOOM.step)" />
      <IconButton variant="float" icon="minus" label="Zoom out" @click="zoomBy(-ZOOM.step)" />
      <IconButton variant="float" icon="locate" label="Recenter" @click="recenter" />
    </div>

    <section class="summary" aria-label="Route summary">
      <div class="summary__row">
        <div>
          <p class="summary__eta">{{ trip.minutesTo(site) }} min</p>
          <p class="t-small muted">
            {{ formatKm(location.distanceTo(site).km) }} · {{ trip.routeTypeConfig.label }} route<template v-if="trip.stops.length"> · {{ pluralize(trip.stops.length, 'stop') }}</template>
          </p>
        </div>
        <BaseButton variant="secondary" size="sm" icon="ar" :to="{ name: 'navigate-ar', params: { id } }">AR view</BaseButton>
      </div>
      <div class="summary__actions">
        <BaseButton variant="secondary" @click="endRoute">End</BaseButton>
        <BaseButton :to="{ name: 'navigate', params: { id } }">Change mode</BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.nav-view {
  position: relative;
  overflow: hidden;
  background: var(--map-land);
}
.nav-view__map {
  position: absolute;
  inset: 0;
  transform-origin: 50% 60%;
  transition: transform var(--dur) var(--ease);
}
.instruction {
  position: absolute;
  top: 52px;
  left: var(--gutter);
  right: var(--gutter);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: 14px var(--s-4);
  border-radius: var(--r-lg);
  background: var(--ink-900);
  color: var(--cream);
  box-shadow: var(--e-2);
}
.instruction__icon {
  width: var(--hit);
  height: var(--hit);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  background: rgba(245, 239, 230, 0.12);
}
.instruction__title {
  font: 700 18px var(--font-label);
}
.instruction__sub {
  font: var(--t-small);
  opacity: 0.8;
}
.zoom {
  position: absolute;
  top: 150px;
  right: var(--gutter);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.summary {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  padding: 18px var(--gutter) var(--s-6);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  background: var(--cream);
  box-shadow: var(--e-3);
}
.summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--s-4);
}
.summary__eta {
  font: 700 26px var(--font-heading);
  color: var(--success-600);
}
.summary__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
</style>
