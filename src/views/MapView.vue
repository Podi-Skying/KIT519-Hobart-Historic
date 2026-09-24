<script setup>
/**
 * Map tab: every heritage site at its real coordinates (Google Maps, or the
 * illustrated map as a fallback), the walker's live position, and route planning.
 * The app covers a small, fixed set of Hobart sites, so there is no search —
 * sites are picked from the map markers or the "nearest" shortcut.
 * The browse panel can be dragged down out of the way; a small tab brings it back.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import StopPicker from '@/components/map/StopPicker.vue'
import RouteTypePicker from '@/components/map/RouteTypePicker.vue'
import { useContent } from '@/i18n/content'
import { MAX_STOPS } from '@/data/navigation'
import { formatMeters } from '@/lib/format'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useSheetDrag } from '@/composables/useSheetDrag'
import { useTripStore } from '@/stores/trip'
import { useUiStore } from '@/stores/ui'
import { useLocationStore } from '@/stores/location'

const { t } = useI18n()
const { sites: SITES } = useContent()
const trip = useTripStore()
const ui = useUiStore()
const location = useLocationStore()

const siteMap = ref(null)

// ---- live distances ----
const distances = computed(() => new Map(SITES.value.map((site) => [site.id, location.distanceTo(site)])))
const nearest = computed(() => [...SITES.value].sort((a, b) => distances.value.get(a.id).km - distances.value.get(b.id).km)[0])
const selected = computed(() => SITES.value.find((s) => s.id === trip.destinationId) ?? null)
const originLabel = computed(() => t(location.originLabelKey))
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

// ---- browse panel: drag down to tuck it away; tap or drag the tab up to bring it back ----
const PEEK_RAISE = 16
const browseOpen = ref(true)
const reopened = ref(false)
const sheetDrag = useSheetDrag(() => (browseOpen.value = false))

function openBrowse() {
  browseOpen.value = true
  reopened.value = true
}

let peekStartY = null
const peekHandlers = {
  pointerdown: (e) => (peekStartY = e.clientY),
  pointerup: (e) => {
    if (peekStartY !== null && peekStartY - e.clientY > PEEK_RAISE) openBrowse()
    peekStartY = null
  },
  pointercancel: () => (peekStartY = null),
}

// ---- location ----
onMounted(() => location.start())

watch(
  () => location.status,
  (status, previous) => {
    if (status === 'denied') ui.showToast(t('map.toast.denied'), { duration: 2600 })
    if (status === 'active' && previous === 'locating' && !location.isInHobart) {
      ui.showToast(t('map.toast.outside'), { duration: 2600 })
    }
  },
)

function locate() {
  if (location.status === 'denied') {
    ui.showToast(t('map.toast.allowLocation'), { duration: 2600 })
    return
  }
  location.start()
  if (location.isInHobart) {
    siteMap.value?.focusUser()
    ui.showToast(t('map.toast.showingYou'))
  } else if (location.status === 'active') {
    ui.showToast(t('map.toast.outside'), { duration: 2600 })
    siteMap.value?.recenter()
  } else {
    ui.showToast(t('map.toast.locating'), { spinner: true, duration: 1600 })
  }
}

// ---- stops & preferences ----
function toggleStop(stop) {
  const result = trip.toggleStop(stop.id)
  const name = t(`waypoints.${stop.id}`)
  const messages = {
    added: t('map.toast.stopAdded', { name }),
    removed: t('map.toast.stopRemoved', { name }),
    full: t('map.toast.stopsFull', { n: MAX_STOPS }),
  }
  ui.showToast(messages[result])
}

function toggleVoice() {
  trip.toggleVoiceGuidance()
  ui.showToast(t(trip.voiceGuidance ? 'map.toast.voiceOn' : 'map.toast.voiceOff'))
}

function toggleOffline() {
  trip.toggleOfflineMap()
  ui.showToast(t(trip.offlineMap ? 'map.toast.offlineOn' : 'map.toast.offlineOff'))
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
      <IconButton variant="float" :icon="trip.voiceGuidance ? 'volume' : 'mute'" :label="t('map.voice')" :pressed="trip.voiceGuidance" @click="toggleVoice" />
      <IconButton variant="float" :icon="trip.offlineMap ? 'download' : 'wifi'" :label="t('map.offline')" :pressed="trip.offlineMap" @click="toggleOffline" />
      <IconButton
        variant="float"
        icon="locate"
        :label="t('map.locate')"
        :active="location.isInHobart"
        @click="locate"
      />
    </div>

    <div
      ref="panel"
      class="panel"
      :class="{ 'is-dragging': sheetDrag.dragging.value }"
      :style="selected ? null : sheetDrag.style.value"
    >
      <!-- Selected destination -->
      <section v-if="selected" class="panel__selected text-zoom" :aria-label="t('map.selected')">
        <div class="selected">
          <img :src="selected.image" :alt="selected.name" class="selected__thumb img-placeholder" />
          <div class="selected__text">
            <h2 class="selected__name">{{ selected.name }}</h2>
            <p class="t-small muted">
              {{ selected.area }} · {{ formatMeters(walk.distanceMeters.value) }} {{ originLabel }}
              <template v-if="walk.status.value === 'fallback'"> · {{ t('map.estimate') }}</template>
            </p>
          </div>
          <IconButton icon="close" :label="t('common.close')" variant="sand" @click="trip.clearDestination" />
        </div>

        <p class="t-caption panel__label">{{ t('map.routeType') }}</p>
        <RouteTypePicker v-model="routeType" :summaries="walk.summaries.value" :loading="walk.status.value === 'loading'" />

        <ul v-if="trip.stops.length" class="stop-chips" :aria-label="t('map.stopsOnRoute')">
          <li v-for="stop in trip.stops" :key="stop.id">
            <AppIcon :name="stop.icon" :size="14" />
            {{ t(`waypoints.${stop.id}`) }}
            <button type="button" :aria-label="t('map.remove', { name: t(`waypoints.${stop.id}`) })" @click="trip.toggleStop(stop.id)">
              <AppIcon name="close" :size="12" :stroke-width="2.6" />
            </button>
          </li>
        </ul>

        <div class="panel__actions">
          <BaseButton variant="secondary" :to="{ name: 'site', params: { id: selected.id } }">{{ t('common.details') }}</BaseButton>
          <BaseButton icon="navigate" :to="{ name: 'navigate', params: { id: selected.id } }">{{ t('common.go') }}</BaseButton>
        </div>
      </section>

      <!-- Browse -->
      <section
        v-else-if="browseOpen"
        class="panel__browse text-zoom"
        :class="{ 'is-reopened': reopened }"
        :aria-label="t('map.planWalk')"
        v-on="sheetDrag.handlers"
        @click.capture="sheetDrag.swallowClick"
      >
        <!-- Tapping the grip hides the panel too: dragging is never the only way (WCAG 2.5.7) -->
        <button type="button" class="panel__hide" :aria-label="t('map.hidePanel')" aria-expanded="true" @click="browseOpen = false">
          <span class="panel__grip" aria-hidden="true" />
        </button>
        <button type="button" class="nearest" @click="trip.setDestination(nearest.id)">
          <span class="nearest__icon"><AppIcon name="pin" :size="20" /></span>
          <span class="nearest__text">
            <span class="t-caption">{{ t('map.nearest') }}</span>
            <b>{{ nearest.name }}</b>
            <small>{{ t('common.minWalk', { n: distances.get(nearest.id).minutes }) }} · {{ originLabel }}</small>
          </span>
          <AppIcon name="chevron" :size="18" class="nearest__chevron" />
        </button>

        <p class="t-caption panel__label panel__label--inset">
          {{ t('map.addStop') }}<template v-if="trip.stopIds.length"> · {{ trip.stopIds.length }}/{{ MAX_STOPS }}</template>
        </p>
        <StopPicker :selected-ids="trip.stopIds" @toggle="toggleStop" />
      </section>

      <!-- Tucked away: just the grip, as a tab -->
      <button v-else type="button" class="peek text-zoom" aria-expanded="false" v-on="peekHandlers" @click="openBrowse">
        <span class="panel__grip" aria-hidden="true" />
        {{ t('map.planWalk') }}
      </button>
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
  transition: transform var(--dur) var(--ease);
}
.panel.is-dragging {
  transition: none;
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
  touch-action: pan-x; /* vertical drags move the panel; the stop row still scrolls sideways */
  user-select: none;
  cursor: grab;
}
.panel.is-dragging .panel__browse {
  cursor: grabbing;
}
.panel__browse.is-reopened {
  animation: slide-up var(--dur-slow) var(--ease);
}
.peek {
  width: 100%;
  padding: var(--s-3) var(--gutter) var(--s-4);
  font: var(--t-label);
  color: var(--ink-700);
  touch-action: none;
}
.panel__hide {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 96px;
  height: 32px;
  margin: calc(-1 * var(--s-3)) auto 0;
  padding-top: var(--s-3);
}
.panel__hide .panel__grip {
  margin: 0;
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
  background: var(--sand-fill);
}
@keyframes slide-up {
  from {
    transform: translateY(24px);
    opacity: 0;
  }
}
</style>
