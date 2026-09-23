<script setup>
/**
 * Map tab: every heritage site at its real coordinates (Google Maps, or the
 * illustrated map as a fallback), the walker's live position, and route planning.
 * The app covers a small, fixed set of Hobart sites, so there is no search —
 * sites are picked from the map or the "nearby" list.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import StopPicker from '@/components/map/StopPicker.vue'
import SiteList from '@/components/map/SiteList.vue'
import RouteTypePicker from '@/components/map/RouteTypePicker.vue'
import { SITES } from '@/data/sites'
import { MAX_STOPS } from '@/data/navigation'
import { formatMeters } from '@/lib/format'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useTripStore } from '@/stores/trip'
import { useUiStore } from '@/stores/ui'
import { useLocationStore } from '@/stores/location'

const trip = useTripStore()
const ui = useUiStore()
const location = useLocationStore()

const siteMap = ref(null)

// ---- live distances ----
const distances = computed(() => new Map(SITES.map((site) => [site.id, location.distanceTo(site)])))
const nearest = computed(() => [...SITES].sort((a, b) => distances.value.get(a.id).km - distances.value.get(b.id).km)[0])
const selected = computed(() => trip.destination)
const userCoords = computed(() => (location.isInHobart ? location.coords : null))

// Real walking route to the selected site (straight-line estimate as fallback)
const walk = useWalkingRoute(selected)

const routeType = computed({
  get: () => trip.routeType,
  set: (key) => trip.setRouteType(key),
})

// ---- bottom panel height → the Google map sits above it (keeps Google's logo visible) ----
const panel = ref(null)
const panelHeight = ref(0)
let resizeObserver
onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => (panelHeight.value = Math.round(entry.contentRect.height)))
  if (panel.value) resizeObserver.observe(panel.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

// ---- location ----
onMounted(() => location.start())

watch(
  () => location.status,
  (status, previous) => {
    if (status === 'denied') ui.showToast('Location is off — distances are from the city centre', { duration: 2600 })
    if (status === 'active' && previous === 'locating' && !location.isInHobart) {
      ui.showToast("You're outside Hobart — distances are from the city centre", { duration: 2600 })
    }
  },
)

function locate() {
  if (location.status === 'denied') {
    ui.showToast('Allow location access in your browser settings', { duration: 2600 })
    return
  }
  location.start()
  if (location.isInHobart) {
    siteMap.value?.focusUser()
    ui.showToast('Showing your location')
  } else if (location.status === 'active') {
    ui.showToast("You're outside Hobart — showing the city centre", { duration: 2600 })
    siteMap.value?.recenter()
  } else {
    ui.showToast('Locating you', { spinner: true, duration: 1600 })
  }
}

// ---- stops & preferences ----
function toggleStop(stop) {
  const result = trip.toggleStop(stop.id)
  const messages = {
    added: `${stop.label} added to route`,
    removed: `${stop.label} removed`,
    full: `You can add up to ${MAX_STOPS} stops`,
  }
  ui.showToast(messages[result])
}

function toggleVoice() {
  trip.toggleVoiceGuidance()
  ui.showToast(trip.voiceGuidance ? 'Voice guidance on' : 'Voice guidance off')
}

function toggleOffline() {
  trip.toggleOfflineMap()
  ui.showToast(trip.offlineMap ? 'Map saved for offline use' : 'Using live map')
}
</script>

<template>
  <div class="map-view">
    <!-- Map sits above the bottom panel so Google's logo and attribution stay visible -->
    <div class="map-view__map" :style="{ bottom: `${Math.max(0, panelHeight - 8)}px` }">
      <SiteMap
        ref="siteMap"
        :sites="SITES"
        :selected-id="trip.destinationId"
        :route-path="selected ? walk.path.value : []"
        :route-type="trip.routeTypeConfig"
        :real-route="walk.isRealRoute.value"
        :user="userCoords"
        :start="selected ? location.origin : null"
        :fit="selected ? 'route' : 'all'"
        :box="{ x: [10, 86], y: [14, 86] }"
        @select="trip.setDestination"
      />
    </div>

    <div class="map-view__controls">
      <IconButton variant="float" :icon="trip.voiceGuidance ? 'volume' : 'mute'" label="Voice guidance" :pressed="trip.voiceGuidance" @click="toggleVoice" />
      <IconButton variant="float" :icon="trip.offlineMap ? 'download' : 'wifi'" label="Save map offline" :pressed="trip.offlineMap" @click="toggleOffline" />
      <IconButton
        variant="float"
        icon="locate"
        label="Show my location"
        :active="location.isInHobart"
        @click="locate"
      />
    </div>

    <div ref="panel" class="panel">
      <!-- Selected destination -->
      <section v-if="selected" class="panel__selected" aria-label="Selected destination">
        <div class="selected">
          <img :src="selected.image" :alt="selected.name" class="selected__thumb img-placeholder" />
          <div class="selected__text">
            <h2 class="selected__name">{{ selected.name }}</h2>
            <p class="t-small muted">
              {{ selected.area }} · {{ formatMeters(walk.distanceMeters.value) }} {{ location.originLabel }}
              <template v-if="walk.status.value === 'fallback'"> · straight-line estimate</template>
            </p>
          </div>
          <IconButton icon="close" label="Close" variant="sand" @click="trip.clearDestination" />
        </div>

        <p class="t-caption panel__label">Route type</p>
        <RouteTypePicker v-model="routeType" :base-minutes="walk.baseMinutes.value" />

        <ul v-if="trip.stops.length" class="stop-chips" aria-label="Stops on this route">
          <li v-for="stop in trip.stops" :key="stop.id">
            <AppIcon :name="stop.icon" :size="14" />
            {{ stop.label }}
            <button type="button" :aria-label="`Remove ${stop.label}`" @click="trip.toggleStop(stop.id)">
              <AppIcon name="close" :size="12" :stroke-width="2.6" />
            </button>
          </li>
        </ul>

        <div class="panel__actions">
          <BaseButton variant="secondary" :to="{ name: 'site', params: { id: selected.id } }">Details</BaseButton>
          <BaseButton icon="navigate" :to="{ name: 'navigate', params: { id: selected.id } }">Go</BaseButton>
        </div>
      </section>

      <!-- Browse -->
      <section v-else class="panel__browse" aria-label="Plan a walk">
        <span class="panel__grip" aria-hidden="true" />
        <button type="button" class="nearest" @click="trip.setDestination(nearest.id)">
          <span class="nearest__icon"><AppIcon name="pin" :size="20" /></span>
          <span class="nearest__text">
            <span class="t-caption">Nearest heritage site</span>
            <b>{{ nearest.name }}</b>
            <small>{{ distances.get(nearest.id).minutes }} min walk {{ location.originLabel }}</small>
          </span>
          <AppIcon name="chevron" :size="18" class="nearest__chevron" />
        </button>

        <p class="t-caption panel__label panel__label--inset">
          Add a stop<template v-if="trip.stopIds.length"> · {{ trip.stopIds.length }}/{{ MAX_STOPS }}</template>
        </p>
        <StopPicker :selected-ids="trip.stopIds" @toggle="toggleStop" />

        <p class="t-caption panel__label panel__label--inset">
          All heritage sites · {{ location.originLabel }}
        </p>
        <SiteList :sites="SITES" :distances="distances" @select="trip.setDestination" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.map-view {
  position: relative;
  overflow: hidden;
  background: var(--map-land);
}
.map-view__map {
  position: absolute;
  inset: 0;
  transition: bottom var(--dur) var(--ease);
}
.map-view__controls {
  position: absolute;
  top: 52px;
  right: var(--gutter);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  max-height: 58%;
  overflow-y: auto;
  background: var(--cream);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  box-shadow: var(--e-3);
  scrollbar-width: none;
}
.panel::-webkit-scrollbar {
  display: none;
}
.panel__selected {
  padding: var(--s-5) var(--gutter);
  animation: slide-up var(--dur-slow) var(--ease);
}
.panel__browse {
  padding: var(--s-3) 0 var(--s-3);
}
.panel__grip {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto var(--s-3);
  border-radius: 2px;
  background: var(--sand-dark);
}
.panel__label {
  margin: var(--s-4) 0 var(--s-2);
}
.panel__label--inset {
  margin: var(--s-4) var(--gutter) var(--s-2);
}
.panel__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
  margin-top: var(--s-4);
}

/* Nearest-site shortcut */
.nearest {
  width: calc(100% - var(--gutter) * 2);
  margin: 0 var(--gutter);
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-md);
  background: linear-gradient(90deg, var(--accent-100), var(--accent-50));
  text-align: left;
}
.nearest__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--paper);
  color: var(--brand-600);
}
.nearest__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.nearest__text .t-caption {
  color: var(--accent-700);
}
.nearest__text b {
  font: 700 16px/22px var(--font-heading);
  color: var(--ink-900);
}
.nearest__text small {
  font: var(--t-small);
  color: var(--ink-700);
}
.nearest__chevron {
  color: var(--ink-500);
}

/* Selected destination */
.selected {
  display: flex;
  align-items: center;
  gap: var(--s-4);
}
.selected__thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--r-md);
  object-fit: cover;
}
.selected__text {
  flex: 1;
  min-width: 0;
}
.selected__name {
  font: 700 17px/22px var(--font-heading);
  color: var(--ink-900);
}
.stop-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: var(--s-3) 0 0;
  padding: 0;
  list-style: none;
}
.stop-chips li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px 0 12px;
  border-radius: var(--r-pill);
  background: var(--paper);
  border: 1.5px solid var(--sand);
  font: 600 12px var(--font-label);
  color: var(--ink-900);
}
.stop-chips button {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--sand);
}
@keyframes slide-up {
  from {
    transform: translateY(24px);
    opacity: 0;
  }
}
</style>
