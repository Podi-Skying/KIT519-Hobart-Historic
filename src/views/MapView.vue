<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import MapCanvas from '@/components/map/MapCanvas.vue'
import StopPicker from '@/components/map/StopPicker.vue'
import SiteList from '@/components/map/SiteList.vue'
import RouteTypePicker from '@/components/map/RouteTypePicker.vue'
import { SITES } from '@/data/sites'
import { MAX_STOPS } from '@/data/navigation'
import { nearestSite } from '@/lib/sites'
import { formatKm } from '@/lib/format'
import { useTripStore } from '@/stores/trip'
import { useUiStore } from '@/stores/ui'

const trip = useTripStore()
const ui = useUiStore()

const nearest = nearestSite(SITES)
const selected = computed(() => trip.destination)
const routeType = computed({
  get: () => trip.routeType,
  set: (key) => trip.setRouteType(key),
})

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

const locate = () => ui.showToast('Locating you', { spinner: true, duration: 1400 })
</script>

<template>
  <div class="map-view">
    <MapCanvas
      :sites="SITES"
      :selected-id="trip.destinationId"
      :route-type="trip.routeTypeConfig"
      @select="trip.setDestination"
    />

    <div class="map-view__controls">
      <IconButton variant="float" :icon="trip.voiceGuidance ? 'volume' : 'mute'" label="Voice guidance" :pressed="trip.voiceGuidance" @click="toggleVoice" />
      <IconButton variant="float" :icon="trip.offlineMap ? 'download' : 'wifi'" label="Save map offline" :pressed="trip.offlineMap" @click="toggleOffline" />
      <IconButton variant="float" icon="locate" label="Show my location" @click="locate" />
    </div>

    <!-- Selected destination -->
    <section v-if="selected" class="panel panel--selected" aria-label="Selected destination">
      <div class="selected">
        <img :src="selected.image" :alt="selected.name" class="selected__thumb img-placeholder" />
        <div class="selected__text">
          <h2 class="selected__name">{{ selected.name }}</h2>
          <p class="t-small muted">{{ selected.area }} · {{ formatKm(selected.distanceKm) }}</p>
        </div>
        <IconButton icon="close" label="Close" variant="sand" @click="trip.clearDestination" />
      </div>

      <p class="t-caption panel__label">Route type</p>
      <RouteTypePicker v-model="routeType" :site="selected" />

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
    <section v-else class="panel panel--browse" aria-label="Plan a walk">
      <div class="where-to">
        <p class="where-to__field"><AppIcon name="search" /> Where to next?</p>
        <p class="where-to__hint">Nearest site: <b>{{ nearest.shortName }}</b> · {{ nearest.walkMinutes }} min walk</p>
      </div>
      <div class="panel__scroll">
        <p class="t-caption panel__label panel__label--inset">
          Add a stop<template v-if="trip.stopIds.length"> · {{ trip.stopIds.length }}/{{ MAX_STOPS }}</template>
        </p>
        <StopPicker :selected-ids="trip.stopIds" @toggle="toggleStop" />
        <p class="t-caption panel__label panel__label--inset">Heritage sites nearby</p>
        <SiteList :sites="SITES" @select="trip.setDestination" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.map-view {
  position: relative;
  overflow: hidden;
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
  background: var(--cream);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  box-shadow: var(--e-3);
}
.panel--selected {
  padding: var(--s-5) var(--gutter) var(--s-5);
  animation: slide-up var(--dur-slow) var(--ease);
}
.panel--browse {
  max-height: 60%;
  display: flex;
  flex-direction: column;
  background: transparent;
  box-shadow: none;
}
.panel__scroll {
  margin-top: -28px;
  padding: 44px 0 var(--s-3);
  overflow-y: auto;
  background: var(--cream);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  box-shadow: var(--e-3);
  scrollbar-width: none;
}
.panel__label {
  margin: var(--s-4) 0 var(--s-2);
}
.panel__label--inset {
  margin: var(--s-3) var(--gutter) var(--s-2);
}
.panel__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
  margin-top: var(--s-4);
}
.where-to {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin: 0 var(--gutter);
  overflow: hidden;
  border-radius: var(--r-md);
  box-shadow: var(--e-2);
}
.where-to__field {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  height: 56px;
  padding: 0 18px;
  background: var(--paper);
  font: 600 16px var(--font-heading);
  color: var(--ink-900);
}
.where-to__hint {
  padding: 10px 12px;
  background: linear-gradient(90deg, var(--accent-100), var(--accent-50));
  text-align: center;
  font: 500 13px var(--font-body);
  color: var(--ink-900);
}
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
