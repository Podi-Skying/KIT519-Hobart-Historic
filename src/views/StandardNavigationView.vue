<script setup>
/**
 * Turn-by-turn navigation on Google Maps: the real walking route (Routes API),
 * the next manoeuvre from the walker's live position, zoom / recentre controls.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import WaypointSheet from '@/components/map/WaypointSheet.vue'
import ArrivalSheet from '@/components/map/ArrivalSheet.vue'
import RouteTypePicker from '@/components/map/RouteTypePicker.vue'
import MapLoading from '@/components/map/MapLoading.vue'
import NavigationModeSheet from '@/components/map/NavigationModeSheet.vue'
import { useContent } from '@/i18n/content'
import { formatMeters } from '@/lib/format'
import { maneuverIcon, nextGuidance } from '@/lib/guidance'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useVoiceGuidance } from '@/composables/useVoiceGuidance'
import { useSnapSheet } from '@/composables/useSnapSheet'
import { useUiStore } from '@/stores/ui'
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
// Navigation starts here directly (from Map › Go or a site's "Start route").
watchEffect(() => trip.setDestination(props.id))
const walk = useWalkingRoute(site)
const modesOpen = ref(false)
/** Route type is chosen here, where the map shows each route (the others drawn faint). */
const routeType = computed({
  get: () => trip.routeType,
  set: (key) => trip.setRouteType(key),
})
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

onMounted(() => location.acquire())
onBeforeUnmount(() => location.release()) // GPS off when no screen needs it

// Pull the panel down to a slim "time · distance" bar so the map is free
const summaryEl = ref(null)
const peekBar = ref(null)
const peekHeight = () => (peekBar.value ? peekBar.value.offsetTop + peekBar.value.offsetHeight + 10 : 72)
const snap = useSnapSheet({ element: () => summaryEl.value, peek: peekHeight })

// ---- the map fills everything above the visible part of the panel ----
const summaryHeight = ref(0)
let summaryObserver
onMounted(() => {
  summaryObserver = new ResizeObserver(([entry]) => (summaryHeight.value = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight)))
  if (summaryEl.value) summaryObserver.observe(summaryEl.value)
})
onBeforeUnmount(() => summaryObserver?.disconnect())
const mapBottom = computed(() => (snap.collapsed.value ? peekHeight() : summaryHeight.value))

// Spoken directions while navigating (the voice toggle lives here, not on the Map tab)
const ui = useUiStore()
useVoiceGuidance({ guidance, siteName: () => site.value.name, enabled: () => trip.voiceGuidance, arrived })
function toggleVoice() {
  trip.toggleVoiceGuidance()
  ui.showToast(t(trip.voiceGuidance ? 'voice.on' : 'voice.off'))
}
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
    <!-- Map ends where the panel begins, so Google's logo and terms stay visible (Maps Platform terms) -->
    <div class="nav-view__map" :style="{ bottom: `${mapBottom}px` }">
      <SiteMap
        ref="map"
        :sites="mapSites"
        :selected-id="site.id"
        :route-path="walk.path.value"
        :route-type="trip.routeTypeConfig"
        :real-route="walk.isRealRoute.value"
        :amenities="walk.amenityMarkers.value"
        :highlights="walk.highlights.value"
        :alternatives="walk.alternatives.value"
        :user="user"
        :start="location.origin"
        fit="route"
        :padding="{ top: 170, right: 76, bottom: 40, left: 40 }"
        :box="{ x: [12, 84], y: [26, 86] }"
        @select-route="trip.setRouteType"
      />
    </div>
    <MapLoading class="nav-view__loading" :show="walk.pending.value" :label="t('navigation.finding')" />

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
      <IconButton
        variant="float"
        :icon="trip.voiceGuidance ? 'volume' : 'mute'"
        :label="t('voice.label')"
        :pressed="trip.voiceGuidance"
        @click="toggleVoice"
      />
      <IconButton variant="float" icon="plus" :label="t('navigation.zoomIn')" @click="map?.zoomIn()" />
      <IconButton variant="float" icon="minus" :label="t('navigation.zoomOut')" @click="map?.zoomOut()" />
      <IconButton variant="float" icon="locate" :label="user ? t('navigation.follow') : t('navigation.showRoute')" @click="recenter" />
      <RouterLink :to="{ name: 'navigate-ar', params: { id } }" class="zoom__ar pressable" data-req="FR10" :aria-label="t('navigation.switchAr')">
        <AppIcon name="ar" :size="20" /><span>AR</span>
      </RouterLink>
    </div>

    <section ref="summaryEl" class="summary text-zoom" :style="snap.style.value" :aria-label="t('navigation.summary')">
      <!-- Handle: drag or tap. Collapsed, only time · distance stays on screen. -->
      <div ref="peekBar" class="summary__peek" v-on="snap.handlers" @click.capture="snap.swallowClick">
        <button
          type="button"
          class="summary__grip pressable-dim"
          :aria-expanded="!snap.collapsed.value"
          :aria-label="snap.collapsed.value ? t('map.showDetails') : t('map.hideDetails')"
          @click="snap.toggle()"
        >
          <span aria-hidden="true" />
        </button>
        <p class="summary__eta num">
          {{ t('common.minutes', { n: walk.minutes.value }) }}
          <span class="summary__distance">· {{ formatMeters(walk.distanceMeters.value) }}</span>
        </p>
      </div>
      <div class="summary__row">
        <p class="t-small muted">{{ routeLine }}</p>
        <div class="summary__buttons">
          <BaseButton variant="quiet" size="sm" data-req="FR15" @click="arrived = true">{{ t('arNav.simulate') }}</BaseButton>
          <BaseButton variant="secondary" size="sm" @click="endRoute">{{ t('navigation.end') }}</BaseButton>
        </div>
      </div>
      <RouteTypePicker v-model="routeType" data-req="FR1" class="summary__routes" :summaries="walk.summaries.value" :loading="walk.pending.value" compact />
      <div class="summary__actions">
        <BaseButton variant="secondary" icon="plus" data-req="FR11" :aria-haspopup="'dialog'" @click="stopsOpen = true">
          {{ t('navigation.addStop') }}<span v-if="trip.stops.length" class="summary__count">{{ trip.stops.length }}</span>
        </BaseButton>
        <BaseButton icon="compass" aria-haspopup="dialog" @click="modesOpen = true">{{ t('navigation.changeMode') }}</BaseButton>
      </div>
    </section>

    <WaypointSheet v-if="stopsOpen" :destination-id="site.id" @close="stopsOpen = false" />
    <ArrivalSheet v-if="arrived" :site="site" @close="arrived = false" />
    <NavigationModeSheet v-if="modesOpen" :site-id="site.id" current="navigate-map" @close="modesOpen = false" />
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
  /* no transition on bottom: the map resizes once, underneath the sliding panel */
}
.instruction {
  position: absolute;
  top: calc(var(--chrome-top) + 2px);
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
  font: var(--t-strong);
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
  gap: 0.625rem;
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
  font: var(--t-micro);
  font-weight: 700;
  box-shadow: var(--e-2);
}
.summary__count {
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border-radius: var(--r-pill);
  background: var(--brand-600);
  color: var(--paper);
  font: var(--t-micro);
  font-weight: 700;
  line-height: 1.25rem;
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
  /* 2nd shadow = cream skirt below, so a bounce past the top never shows a gap */
  box-shadow: var(--e-3), 0 160px 0 0 var(--cream);
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
  font: var(--t-metric);
  letter-spacing: var(--track-h1);
  color: var(--success-600);
}
.summary__peek {
  touch-action: none;
  cursor: grab;
  user-select: none;
}
.summary__grip {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: var(--hit); /* 44pt, like the Map panel's handle; takes the same 14px of layout as before */
  margin: -20px 0 -10px;
}
.summary__grip span {
  display: block;
  width: 40px;
  height: 4px;
  border-radius: var(--r-pill);
  background: var(--sand-dark);
}
.summary__distance {
  font: var(--t-title);
  color: var(--ink-700);
}
.summary__routes {
  margin-bottom: var(--s-3);
}
.nav-view__loading {
  top: calc(var(--chrome-top) + 96px);
}
.summary__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
</style>
