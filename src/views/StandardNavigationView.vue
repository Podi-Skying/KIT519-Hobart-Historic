<script setup>
/**
 * Turn-by-turn navigation on Google Maps: the real walking route (Routes API),
 * the next manoeuvre from the walker's live position, zoom / recentre controls.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import WaypointSheet from '@/components/map/WaypointSheet.vue'
import ArrivalSheet from '@/components/map/ArrivalSheet.vue'
import { useContent } from '@/i18n/content'
import { formatMeters } from '@/lib/format'
import { maneuverIcon, nextGuidance } from '@/lib/guidance'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useTripStore } from '@/stores/trip'
import { useLocationStore } from '@/stores/location'

const props = defineProps({
  id: { type: Number, required: true },
})

const router = useRouter()
const { t } = useI18n()
const { siteById } = useContent()
const trip = useTripStore()
const location = useLocationStore()
const site = computed(() => siteById(props.id))
const walk = useWalkingRoute(site)
const map = ref(null)
const stopsOpen = ref(false)
const arrived = ref(false)

const user = computed(() => (location.isInHobart ? location.coords : null))
const guidance = computed(() => nextGuidance(walk.route.value, user.value))
const mapSites = computed(() => [site.value, ...walk.stopSites.value])
/** "Accessible route · ↑ 12 m" — route type plus its real climb when known. */
const routeLine = computed(() => {
  const parts = [t('navigation.routeLabel', { type: t(`routeTypes.${trip.routeType}.label`) })]
  const climb = walk.selectedSummary.value.climbMeters
  if (climb != null) parts.push(t('routeTypes.climb', { m: climb }))
  if (trip.stops.length) parts.push(t('common.stops', trip.stops.length))
  return parts.join(' · ')
})
/** Guidance text: Google's instruction, with our own wording for start/arrival. */
const guidanceText = computed(() => {
  if (guidance.value.kind === 'none') return t('navigation.headToDestination')
  if (guidance.value.kind === 'arrive') return t('navigation.arrive')
  return guidance.value.instruction // already localised by the Routes API
})

onMounted(() => location.start())
// Same as AR navigation: reaching the destination opens the arrival sheet.
watch(() => guidance.value.arrived, (now) => now && (arrived.value = true))

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
      :amenities="walk.amenityMarkers.value"
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
          <p class="instruction__title">{{ t('navigation.finding') }}</p>
        </template>
        <template v-else-if="walk.isRealRoute.value">
          <p class="instruction__title">
            {{ guidance.meters ? t('navigation.inDistance', { distance: formatMeters(guidance.meters) }) : t('navigation.start') }}
          </p>
          <p class="instruction__sub">{{ guidanceText }}</p>
        </template>
        <template v-else>
          <p class="instruction__title">{{ t('navigation.headTo', { name: site.shortName }) }}</p>
          <p class="instruction__sub">{{ t('navigation.noDirections') }}</p>
        </template>
      </div>
    </div>

    <div class="zoom">
      <IconButton variant="float" icon="plus" :label="t('navigation.zoomIn')" @click="map?.zoomIn()" />
      <IconButton variant="float" icon="minus" :label="t('navigation.zoomOut')" @click="map?.zoomOut()" />
      <IconButton variant="float" icon="locate" :label="user ? t('navigation.follow') : t('navigation.showRoute')" @click="recenter" />
      <RouterLink :to="{ name: 'navigate-ar', params: { id } }" class="zoom__ar" :aria-label="t('navigation.switchAr')">
        <AppIcon name="ar" :size="20" /><span>AR</span>
      </RouterLink>
    </div>

    <section class="summary text-zoom" :aria-label="t('navigation.summary')">
      <div class="summary__row">
        <div>
          <p class="summary__eta">{{ t('common.minutes', { n: walk.minutes.value }) }}</p>
          <p class="t-small muted">{{ formatMeters(walk.distanceMeters.value) }} · {{ routeLine }}</p>
        </div>
        <div class="summary__buttons">
          <BaseButton variant="quiet" size="sm" @click="arrived = true">{{ t('arNav.simulate') }}</BaseButton>
          <BaseButton variant="secondary" size="sm" @click="endRoute">{{ t('navigation.end') }}</BaseButton>
        </div>
      </div>
      <div class="summary__actions">
        <BaseButton variant="secondary" icon="plus" :aria-haspopup="'dialog'" @click="stopsOpen = true">
          {{ t('navigation.addStop') }}<span v-if="trip.stops.length" class="summary__count">{{ trip.stops.length }}</span>
        </BaseButton>
        <BaseButton :to="{ name: 'navigate', params: { id } }">{{ t('navigation.changeMode') }}</BaseButton>
      </div>
    </section>

    <WaypointSheet v-if="stopsOpen" :destination-id="site.id" @close="stopsOpen = false" />
    <ArrivalSheet v-if="arrived" :site="site" @close="arrived = false" />
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
.zoom__ar {
  width: var(--hit);
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: var(--r-md);
  background: var(--ink-900);
  color: var(--cream);
  font: 700 10px var(--font-label);
  box-shadow: var(--e-2);
}
.summary__count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--r-pill);
  background: var(--brand-600);
  color: var(--paper);
  font: 700 11px/20px var(--font-label);
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
.summary__buttons {
  display: flex;
  gap: var(--s-2);
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
