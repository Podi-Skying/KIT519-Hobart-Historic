<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ArStatusPill from '@/components/ar/ArStatusPill.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import StreetView360 from '@/components/ar/StreetView360.vue'
import { isGoogleMapsConfigured } from '@/services/googleMaps'
import { bearing, pointAhead } from '@/lib/streetView'
import { distanceKm } from '@/lib/geo'
import ArrivalSheet from '@/components/map/ArrivalSheet.vue'
import { useContent } from '@/i18n/content'
import { formatMeters } from '@/lib/format'
import { maneuverIcon, nextGuidance } from '@/lib/guidance'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useTripStore } from '@/stores/trip'
import { useLocationStore } from '@/stores/location'
import { useGoBack } from '@/composables/useGoBack'
import { useVoiceGuidance } from '@/composables/useVoiceGuidance'
import { LOOK_SCALE, useLookAround } from '@/composables/useLookAround'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  id: { type: Number, required: true },
})

const { t } = useI18n()
const { siteById } = useContent()
const trip = useTripStore()
const location = useLocationStore()
const site = computed(() => siteById(props.id))
const walk = useWalkingRoute(site)
const user = computed(() => (location.isInHobart ? location.coords : null))
const guidance = computed(() => nextGuidance(walk.route.value, user.value))
const instruction = computed(() => {
  const g = guidance.value
  if (!walk.isRealRoute.value || g.kind === 'none') return t('navigation.headTo', { name: site.value.shortName })
  const text = g.kind === 'arrive' ? t('navigation.arrive') : g.instruction
  return g.meters ? `${formatMeters(g.meters)} · ${text}` : text
})
onMounted(() => location.acquire())
onBeforeUnmount(() => location.release()) // GPS off when no screen needs it
const arrived = ref(false)
// Reaching the destination opens the arrival sheet by itself (location-triggered content).
watch(() => guidance.value.arrived, (now) => now && (arrived.value = true))
const close = useGoBack({ name: 'navigate-map', params: { id: props.id } })

// Spoken directions, same as the standard map
const ui = useUiStore()
useVoiceGuidance({ guidance, siteName: () => site.value.name, enabled: () => trip.voiceGuidance, arrived })
function toggleVoice() {
  trip.toggleVoiceGuidance()
  ui.showToast(t(trip.voiceGuidance ? 'voice.on' : 'voice.off'))
}

// ---- The view is 360° Street View where the walker is, turned to face the way ahead ----
/** 'loading' | 'ready' | 'none' — 'none' (no Maps key / no panorama here) falls back to the photo. */
const pano = ref(isGoogleMapsConfigured() ? 'loading' : 'none')
const view360 = computed(() => pano.value !== 'none')
/** Walker, or the default origin before they're located / outside Hobart. */
const here = computed(() => location.origin)
const ahead = computed(() => pointAhead(walk.path.value, here.value) ?? site.value.coordinates)
function onPanoReady() {
  pano.value = 'ready'
  ui.showToast(t('ar.view360Hint'), { duration: 2600 })
}
/** The panorama's GPU context died (memory pressure): remount a fresh one. */
const panoKey = ref(0)
function onPanoLost() {
  pano.value = 'loading'
  panoKey.value++
}
function onPanoUnavailable() {
  if (pano.value === 'none') return
  pano.value = 'none'
  ui.showToast(t('arNav.view360None'), { duration: 3000 })
}

// Fallback only (no Street View): look around the photo; the painted arrows sit closer (parallax)
const stage = ref(null)
const look = useLookAround({ frame: () => stage.value })
const vLook = look.directive
// Google's logo and terms sit at the bottom of the panorama and must stay visible (Maps Platform
// terms): the panorama ends at the top of the map dome instead of running underneath it.
const dome = ref(null)
const summaryHeight = ref(0) // px from the bottom where the panorama stops (the dome's apex)
let domeObserver
onMounted(() => {
  domeObserver = new ResizeObserver(() => (summaryHeight.value = dome.value?.offsetHeight ?? 0))
  if (dome.value) domeObserver.observe(dome.value)
})
onBeforeUnmount(() => domeObserver?.disconnect())

/** Live-View map: heading-up along the route, the way the walker (and the panorama) faces. */
const routeHeading = computed(() =>
  distanceKm(here.value, ahead.value) * 1000 > 3 ? bearing(here.value, ahead.value) : 0,
)
const follow = computed(() => ({ position: here.value, heading: routeHeading.value }))
</script>

<template>
  <div ref="stage" class="ar-nav" v-on="look.handlers">
    <!-- A photo of the approach to this site: dimmed while Street View loads (never a black
         screen), and the whole view when there's no Street View here -->
    <!-- stays underneath once Street View is ready, so the panorama's fade-in never shows black -->
    <div v-look="[1, LOOK_SCALE]" class="ar-nav__world" :class="{ 'is-waiting': pano === 'loading' }">
      <img class="ar-nav__feed" :src="site.arApproachImage" :alt="t('arNav.feedAlt', { name: site.name })" draggable="false" />
    </div>
    <ArStatusPill v-if="pano === 'loading'" class="ar-nav__loading" spinner>{{ t('ar.view360Loading') }}</ArStatusPill>
    <Transition name="pano-fade">
      <StreetView360
        v-if="view360"
        :key="panoKey"
        data-no-look
        :at="here"
        :target="ahead"
        :pitch="0"
        :style="{ bottom: `${summaryHeight}px` }"
        @ready="onPanoReady"
        @unavailable="onPanoUnavailable"
        @lost="onPanoLost"
      />
    </Transition>
    <div class="ar-nav__veil" />

    <div class="ar-nav__top" data-no-look>
      <!-- same control, same place as the AR camera: a glass Back button -->
      <IconButton variant="glass" icon="back" :label="t('arNav.close')" @click="close" />
      <span class="ar-nav__actions">
        <IconButton
          variant="glass"
          :icon="trip.voiceGuidance ? 'volume' : 'mute'"
          :label="t('voice.label')"
          :pressed="trip.voiceGuidance"
          @click="toggleVoice"
        />
        <BaseButton variant="secondary" size="sm" icon="map" :to="{ name: 'navigate-map', params: { id } }">{{ t('arNav.map') }}</BaseButton>
      </span>
    </div>

    <ArStatusPill data-toast-below :icon="maneuverIcon(guidance.maneuver)" class="ar-nav__instruction">{{ instruction }}</ArStatusPill>

    <!-- the painted arrows belong to the fallback photo; in 360° the street itself (turned ahead) shows the way -->
    <div v-if="pano === 'none'" v-look="1.4" class="ar-nav__near" aria-hidden="true">
    <div class="ar-nav__arrows">
      <svg v-for="n in 3" :key="n" width="72" height="44" viewBox="0 0 72 44" :style="{ animationDelay: `${(n - 1) * 0.15}s` }">
        <path class="ar-nav__arrow" d="M4 40 L36 6 L68 40 L36 27 Z" stroke-width="2.5" stroke-linejoin="round" />
      </svg>
    </div>
    </div>

    <!-- Live-View style map: a dome along the bottom, heading-up around the walker.
         The whole dome opens the full map; its bottom strip stays free for Google's logo/terms. -->
    <section ref="dome" class="ar-nav__dome" data-no-look :aria-label="t('arNav.openMap')">
      <div class="ar-nav__dome-map">
        <SiteMap
          :sites="[site]"
          :selected-id="site.id"
          :route-path="walk.path.value"
          :route-type="trip.routeTypeConfig"
          :real-route="walk.isRealRoute.value"
          :amenities="walk.amenityMarkers.value"
          :user="user"
          :start="location.origin"
          :follow="follow"
          fit="route"
          :interactive="false"
          :box="{ x: [15, 85], y: [30, 85] }"
        />
      </div>
      <RouterLink :to="{ name: 'navigate-map', params: { id } }" class="ar-nav__dome-open" :aria-label="t('arNav.openMap')" />
      <div class="ar-nav__trip text-zoom">
        <p class="ar-nav__eta">{{ t('common.minutes', { n: walk.minutes.value }) }}</p>
        <p class="ar-nav__dest">{{ site.shortName }}</p>
        <BaseButton size="sm" @click="arrived = true">{{ t('arNav.simulate') }}</BaseButton>
      </div>
    </section>

    <ArrivalSheet v-if="arrived" :site="site" primary="ar" @close="arrived = false" />
  </div>
</template>

<style scoped>
.ar-nav {
  position: relative;
  overflow: hidden;
  background: var(--camera-bg);
  touch-action: none; /* drags look around instead of scrolling the page */
}
.ar-nav__arrow {
  fill: var(--ar-arrow);
  stroke: var(--paper);
}
.ar-nav__world,
.ar-nav__near {
  position: absolute;
  inset: 0;
  will-change: transform;
  pointer-events: none;
}
.ar-nav__near {
  z-index: 1;
}
.ar-nav__actions {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.ar-nav__feed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ar-nav__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 28%);
  pointer-events: none;
}
.ar-nav__top {
  position: absolute;
  top: var(--chrome-top);
  left: var(--gutter);
  right: var(--gutter);
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ar-nav__world {
  transition: filter var(--dur) var(--ease);
}
.ar-nav__world.is-waiting {
  filter: brightness(0.55) saturate(0.8); /* a placeholder, clearly not the live view */
}
.ar-nav__loading {
  position: absolute;
  top: 42%;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%);
}
.ar-nav__instruction {
  position: absolute;
  top: calc(var(--chrome-top) + 58px);
  left: 50%;
  z-index: 2;
  width: max-content;
  max-width: calc(100% - var(--gutter) * 2);
  white-space: normal; /* real street instructions can be long */
  transform: translateX(-50%);
}
.ar-nav__arrows {
  position: absolute;
  top: 36%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
}
.ar-nav__arrows svg {
  filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.7));
  animation: bob 1.2s ease-in-out infinite;
}
.ar-nav__arrows svg:nth-child(2) { opacity: 0.8; }
.ar-nav__arrows svg:nth-child(3) { opacity: 0.6; }
.ar-nav__dome {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 38%;
  /* a wide arc, like Live View: flat enough that the panorama's attribution above stays clear */
  clip-path: ellipse(120% 100% at 50% 100%);
  background: var(--paper); /* the 4px rim along the arc */
}
.ar-nav__dome-map {
  position: absolute;
  inset: 4px 0 0;
  clip-path: ellipse(120% 100% at 50% 100%);
  background: var(--map-land);
}
.ar-nav__dome-map > * {
  pointer-events: none; /* a glance map: the link above opens the full one */
}
.ar-nav__dome-open {
  position: absolute;
  inset: 0 0 32px; /* Google's logo / Terms strip stays tappable */
  z-index: 1;
}
.ar-nav__trip {
  position: absolute;
  top: 14%;
  left: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  max-width: calc(100% - var(--gutter) * 2);
  padding: 4px 4px 4px var(--s-4);
  border-radius: var(--r-pill);
  background: var(--paper);
  box-shadow: var(--e-2);
  transform: translateX(-50%);
  white-space: nowrap;
}
.ar-nav__dest {
  overflow: hidden;
  text-overflow: ellipsis;
  font: var(--t-label);
  color: var(--ink-700);
}
.ar-nav__eta {
  font: var(--t-strong);
  letter-spacing: var(--track-h1);
  color: var(--success-600);
}
.pano-fade-enter-active,
.pano-fade-leave-active {
  transition: opacity var(--dur) var(--ease);
}
.pano-fade-enter-from,
.pano-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .ar-nav__arrows svg {
    animation: none;
  }
}
@keyframes bob {
  50% {
    transform: translateY(-6px);
  }
}
</style>
