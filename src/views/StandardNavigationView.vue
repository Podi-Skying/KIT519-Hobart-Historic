<script setup>
/**
 * Turn-by-turn navigation on Google Maps: the real walking route (Routes API),
 * the next manoeuvre from the walker's live position, zoom / recentre controls.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import { getSiteById } from '@/data/sites'
import { formatMeters, pluralize } from '@/lib/format'
import { maneuverIcon, nextGuidance } from '@/lib/guidance'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useTripStore } from '@/stores/trip'
import { useLocationStore } from '@/stores/location'

const props = defineProps({
  id: { type: Number, required: true },
})

const router = useRouter()
const trip = useTripStore()
const location = useLocationStore()
const site = computed(() => getSiteById(props.id))
const walk = useWalkingRoute(site)
const map = ref(null)

const user = computed(() => (location.isInHobart ? location.coords : null))
const guidance = computed(() => nextGuidance(walk.route.value, user.value))
const mapSites = computed(() => [site.value, ...walk.stopSites.value])

onMounted(() => location.start())

function recenter() {
  if (user.value) map.value?.focusUser()
  else map.value?.recenter()
}
const endRoute = () => router.push({ name: 'map' })
</script>

<template>
  <div class="nav-view">
    <SiteMap
      ref="map"
      class="nav-view__map"
      :sites="mapSites"
      :selected-id="site.id"
      :route-path="walk.path.value"
      :route-type="trip.routeTypeConfig"
      :real-route="walk.isRealRoute.value"
      :user="user"
      :start="location.origin"
      fit="route"
      :padding="{ top: 170, right: 76, bottom: 200, left: 40 }"
      :box="{ x: [12, 84], y: [26, 70] }"
    />

    <div class="instruction" role="status" aria-live="polite">
      <span class="instruction__icon"><AppIcon :name="maneuverIcon(guidance.maneuver)" :size="24" /></span>
      <div class="instruction__text">
        <template v-if="walk.status.value === 'loading'">
          <p class="instruction__title">Finding a walking route…</p>
        </template>
        <template v-else-if="walk.isRealRoute.value">
          <p class="instruction__title">{{ guidance.meters ? `In ${formatMeters(guidance.meters)}` : 'Start' }}</p>
          <p class="instruction__sub">{{ guidance.instruction }}</p>
        </template>
        <template v-else>
          <p class="instruction__title">Head to {{ site.shortName }}</p>
          <p class="instruction__sub">Street directions unavailable — showing a straight-line guide</p>
        </template>
      </div>
    </div>

    <div class="zoom">
      <IconButton variant="float" icon="plus" label="Zoom in" @click="map?.zoomIn()" />
      <IconButton variant="float" icon="minus" label="Zoom out" @click="map?.zoomOut()" />
      <IconButton variant="float" icon="locate" :label="user ? 'Follow my location' : 'Show whole route'" @click="recenter" />
    </div>

    <section class="summary" aria-label="Route summary">
      <div class="summary__row">
        <div>
          <p class="summary__eta">{{ walk.minutes.value }} min</p>
          <p class="t-small muted">
            {{ formatMeters(walk.distanceMeters.value) }} · {{ trip.routeTypeConfig.label }} route<template v-if="trip.stops.length"> · {{ pluralize(trip.stops.length, 'stop') }}</template>
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  background: rgba(245, 239, 230, 0.12);
}
.instruction__text {
  min-width: 0;
}
.instruction__title {
  font: 700 18px var(--font-label);
}
.instruction__sub {
  font: var(--t-small);
  opacity: 0.85;
}
.zoom {
  position: absolute;
  top: 160px;
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
