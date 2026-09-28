<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import IconButton from '@/components/base/IconButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
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
import { haptic } from '@/services/haptics'

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
const router = useRouter()
const openMap = () => router.push({ name: 'navigate-map', params: { id: props.id } })
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
let coached = false
function onPanoReady() {
  pano.value = 'ready'
  if (coached) return
  coached = true // say what this screen is for, once: walk with the buttons, look by dragging / turning
  ui.showToast(t('arNav.coach'), { duration: 4000 })
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
const summaryHeight = ref(0) // dome height: the panorama runs underneath it; its controls sit above
/** Street View's image credit, shown in the dome (Google's own strip is under the dome now). */
const panoCredit = ref('')
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

// ---- walk ahead through Street View, guided by 3D arrows on the ground ----
const sv = ref(null)
/** Where the panorama stands and looks ({ position, heading }), reported by StreetView360. */
const panoView = ref(null)
/** Direction of the route from where the *view* stands (it may have walked ahead of the walker). */
const guideHeading = computed(() => {
  const at = panoView.value?.position
  if (!at) return routeHeading.value
  const next = pointAhead(walk.path.value, at) ?? site.value.coordinates
  return distanceKm(at, next) * 1000 > 3 ? bearing(at, next) : routeHeading.value
})
/** Arrow turn on the ground, relative to where the view looks (−180…180°). */
const arrowTurn = computed(() => {
  const d = guideHeading.value - (panoView.value?.heading ?? guideHeading.value)
  return ((((d % 360) + 540) % 360) - 180)
})
/** The dome map follows the view: after walking ahead in Street View it shows where you "are". */
const follow = computed(() => ({ position: panoView.value?.position ?? here.value, heading: guideHeading.value }))
const going = ref(false)
/** Buttons reflect what's possible right now (disabled rather than failing after a tap). */
const canForward = ref(false)
const canBack = ref(false)
function onView(v) {
  panoView.value = v
  canBack.value = v.canBack
  nextTick(() => (canForward.value = sv.value?.canStep(guideHeading.value) ?? false))
}
async function walkAhead() {
  if (going.value) return
  if (!canForward.value) return ui.showToast(t('arNav.noPathAhead'), { duration: 2600 })
  going.value = true // arrows surge forward while the view steps
  const moved = await sv.value?.stepForward(guideHeading.value)
  if (moved) haptic('selection')
  setTimeout(() => (going.value = false), 350)
}
async function walkBack() {
  if (going.value || !canBack.value) return
  going.value = true
  if (await sv.value?.stepBack()) haptic('selection')
  setTimeout(() => (going.value = false), 350)
}
/** Moving is buttons-only: Street View's own ↑/↓ (and W/S) keys would jump the view without the
    arrows, haptics or Back history, so they're stopped before they reach the panorama.
    ←/→ still turn the view. */
const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'])
function blockKeyMoves(e) {
  if (MOVE_KEYS.has(e.key) && e.target instanceof Element && e.target.closest('.street-view')) {
    e.preventDefault()
    e.stopPropagation()
  }
}
</script>

<template>
  <div ref="stage" class="ar-nav" v-on="look.handlers" @keydown.capture="blockKeyMoves">
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
        ref="sv"
        :key="panoKey"
        data-no-look
        :at="here"
        :target="ahead"
        :pitch="0"
        :bottom-inset="summaryHeight + 56"
        @credit="(c) => (panoCredit = c)"
        @view="onView"
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
        <IconButton variant="glass" icon="map" :label="t('arNav.openMap')" @click="openMap" />
      </span>
    </div>

    <!-- one card for "what next" and "how long": the trip summary no longer sits on the map -->
    <ArStatusPill data-toast-below :icon="maneuverIcon(guidance.maneuver)" class="ar-nav__instruction">
      <span class="ar-nav__instr">
        <span>{{ instruction }}</span>
        <small>{{ t('common.minutes', { n: walk.minutes.value }) }} · {{ site.shortName }}</small>
      </span>
    </ArStatusPill>

    <!-- 360°: 3D arrows lie on the ground and point along the route. They only show the way:
         moving is done with the two labelled buttons below, one clear way to do it. -->
    <div
      v-if="pano === 'ready'"
      class="ar-nav__go"
      :class="{ 'is-going': going, 'is-blocked': !canForward }"
      aria-hidden="true"
    >
      <span class="ar-nav__floor" :style="{ '--turn': `${arrowTurn}deg` }">
        <svg v-for="n in 3" :key="n" class="ar-nav__chev" :style="{ '--i': n - 1 }" viewBox="0 0 90 56">
          <path d="M6 50 L45 8 L84 50 L45 32 Z" />
        </svg>
      </span>
    </div>
    <div v-if="pano === 'ready'" class="ar-nav__steps" role="group" :aria-label="t('arNav.stepsLabel')" data-no-look>
      <button type="button" class="ar-nav__step pressable" :disabled="!canBack || going" @click="walkBack">
        <AppIcon name="up" :size="18" :stroke-width="2.6" class="ar-nav__step-icon--back" />
        {{ t('arNav.stepBack') }}
      </button>
      <button type="button" class="ar-nav__step ar-nav__step--primary pressable" :disabled="!canForward || going" @click="walkAhead">
        <AppIcon name="up" :size="18" :stroke-width="2.6" />
        {{ t('arNav.walkAhead') }}
      </button>
    </div>

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
    </section>

    <!-- image credit on the left shoulder; the prototype control tucked into the map's lower-right corner -->
    <button type="button" class="ar-nav__simulate pressable" data-no-look @click="arrived = true">{{ t('arNav.simulate') }}</button>
    <p v-if="view360 && panoCredit" class="ar-nav__credit">Street View {{ panoCredit }}</p>

    <ArrivalSheet v-if="arrived" :site="site" primary="ar" @close="arrived = false" />
  </div>
</template>

<style scoped>
.ar-nav {
  position: relative;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none; /* dragging to look around must never highlight the instruction text */
  -webkit-touch-callout: none;
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
  filter: drop-shadow(0 0 10px var(--ar-glow));
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
  height: 30%;
  /* a round arc like Live View; the panorama continues underneath it */
  clip-path: ellipse(56% 100% at 50% 100%);
  background: var(--paper); /* the 4px rim along the arc */
}
.ar-nav__dome-map {
  position: absolute;
  inset: 4px 0 0;
  clip-path: ellipse(56% 100% at 50% 100%);
  background: var(--map-land);
  transform-origin: 50% 100%;
  transition: scale var(--dur) var(--ease);
}
/* press feedback on touch-down: the map dips a little before the full map opens */
.ar-nav__dome:has(.ar-nav__dome-open:active) .ar-nav__dome-map {
  scale: var(--press-scale-card);
  transition-duration: 0ms;
}
.ar-nav__dome-map > * {
  pointer-events: none; /* a glance map: the link above opens the full one */
}
.ar-nav__dome-open {
  position: absolute;
  inset: 0 0 32px; /* Google's logo / Terms strip stays tappable */
  z-index: 1;
}
.ar-nav__instr {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ar-nav__instr small {
  font: var(--t-label-sm);
  color: var(--ink-300);
}
/* prototype control: a glass chip in the map's lower-right corner, clear of Google's
   logo/Terms strip (bottom 32px) and of the route, which runs up the middle */
.ar-nav__simulate {
  position: absolute;
  right: var(--gutter);
  bottom: calc(32px + var(--s-2));
  z-index: 3;
  min-height: var(--hit);
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--glass);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  color: var(--cream);
  font: var(--t-button);
  box-shadow: var(--e-2);
}
/* image credit: a small glass capsule on the left shoulder, readable over a bright sky */
.ar-nav__credit {
  position: absolute;
  left: var(--gutter);
  bottom: calc(30% * 0.62 + var(--s-3));
  z-index: 2;
  max-width: 45%;
  padding: 4px var(--s-2);
  border-radius: var(--r-pill);
  background: var(--glass);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  font: var(--t-meta);
  color: var(--cream);
  pointer-events: none;
}
/* ---- 3D ground arrows (360°) ---- */
.ar-nav__go {
  position: absolute;
  left: 50%;
  bottom: calc(30% + var(--s-3) + var(--hit) + var(--s-2)); /* above the step buttons */
  z-index: 2;
  width: 160px;
  height: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  background: none;
  transform: translateX(-50%);
  perspective: 520px;
  pointer-events: none; /* shows the way only; the buttons move */
}
.ar-nav__floor {
  position: relative;
  width: 120px;
  height: 150px;
  transform-style: preserve-3d;
  /* laid on the ground, turned toward the route */
  transform: rotateX(52deg) rotateZ(var(--turn, 0deg));
  transition: transform var(--dur-page) var(--ease);
}
.ar-nav__chev {
  position: absolute;
  left: 5px;
  bottom: calc(var(--i) * 48px);
  width: 110px;
  height: 68px;
  overflow: visible;
  /* AR-layer cyan face (README §5.2: navigation arrows are the AR overlay colour, not the
     "you are here" blue), paper rim, a deeper cyan extrusion = a chunky 3D chevron that reads
     on any street */
  filter: drop-shadow(0 8px 0 var(--ar-700)) drop-shadow(0 14px 12px rgba(0, 0, 0, 0.4));
  animation: chev-flow 1.5s var(--ease) infinite;
  animation-delay: calc(var(--i) * 0.18s);
}
.ar-nav__chev path {
  fill: var(--ar-400);
  stroke: var(--paper);
  stroke-width: 6;
  stroke-linejoin: round;
}
.ar-nav__go.is-blocked .ar-nav__chev {
  opacity: 0.35;
  animation: none; /* nothing further this way: arrows rest */
}
/* Step back · Walk ahead — a glass capsule pair just above the map */
.ar-nav__steps {
  position: absolute;
  left: 50%;
  bottom: calc(30% + var(--s-3));
  z-index: 3;
  display: flex;
  gap: var(--s-2);
  transform: translateX(-50%);
}
.ar-nav__step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--hit);
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--glass);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  color: var(--cream);
  font: var(--t-button);
  white-space: nowrap;
  box-shadow: var(--e-2);
  transition: opacity var(--dur) var(--ease), background var(--dur) var(--ease), scale var(--dur) var(--ease);
}
.ar-nav__step--primary {
  background: var(--brand-600); /* the one action colour (README §5.2) */
  color: var(--paper);
}
.ar-nav__step--primary:active:not(:disabled) {
  background: var(--brand-700);
}
.ar-nav__step:disabled {
  opacity: 0.45;
}
.ar-nav__step-icon--back {
  rotate: 180deg;
}
/* tapped: the arrows surge forward with the view */
.ar-nav__go.is-going .ar-nav__chev {
  animation: chev-surge 0.35s var(--ease) both;
}
@keyframes chev-flow {
  0% { opacity: 0.55; translate: 0 18px; }
  45% { opacity: 1; }
  100% { opacity: 0.55; translate: 0 -18px; }
}
@keyframes chev-surge {
  to { opacity: 0; translate: 0 -70px; scale: 1.15; }
}
@media (prefers-reduced-motion: reduce) {
  .ar-nav__chev,
  .ar-nav__go.is-going .ar-nav__chev {
    animation: none;
  }
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
