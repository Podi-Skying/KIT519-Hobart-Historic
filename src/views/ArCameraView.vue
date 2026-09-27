<script setup>
/**
 * AR camera (simulated): "scans" for ~1.6 s, then shows the landmark in view —
 * the site from the URL, or the one nearest the walker — with draggable
 * hotspots for info, audio and photos. Every image and text follows that site.
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BottomSheet from '@/components/base/BottomSheet.vue'
import ArStatusPill from '@/components/ar/ArStatusPill.vue'
import ArBubble from '@/components/ar/ArBubble.vue'
import ArHelpOverlay from '@/components/ar/ArHelpOverlay.vue'
import StreetView360 from '@/components/ar/StreetView360.vue'
import { isGoogleMapsConfigured } from '@/services/googleMaps'
import { localizeNarration, useContent } from '@/i18n/content'
import { siteTimeline } from '@/lib/sites'
import { advancePosition, arTimeline, layerOpacity } from '@/lib/timeline'
import { usePlayerStore } from '@/stores/player'
import { useUiStore } from '@/stores/ui'
import { LOOK_SCALE, useLookAround } from '@/composables/useLookAround'
import { frameDirective } from '@/composables/frameDirective'
import { useLocationStore } from '@/stores/location'

const props = defineProps({
  id: { type: Number, default: null },
})

const SCAN_DURATION_MS = 1600
const DEFAULT_HOTSPOTS = {
  info: { x: 74, y: 44 },
  audio: { x: 28, y: 52 },
  photos: { x: 64, y: 64 },
}

const router = useRouter()
const { t, locale } = useI18n()
const { sites, siteById } = useContent()
const player = usePlayerStore()
const location = useLocationStore()

/** The landmark in view: from the URL, else the one closest to the walker. */
const site = computed(() => {
  if (props.id) return siteById(props.id)
  return [...sites.value].sort((a, b) => location.distanceTo(a).km - location.distanceTo(b).km)[0]
})
// ---- Through time, right here: the building ages in place while you listen ----
/** Today (the camera view) → the oldest photo. */
const timeline = computed(() => arTimeline(siteTimeline(site.value), site.value.arImage))
const lastIndex = computed(() => timeline.value.length - 1)
/** 0 = today … lastIndex = oldest; fractional = two photos blended. */
const position = ref(0)
const nearest = computed(() => Math.round(position.value))
const shownPhoto = computed(() => timeline.value[nearest.value])
const timePlaying = ref(false)
const yearLabel = (p) => (p.year ? p.year : t('compare.today'))
/**
 * The playhead moves every frame while the building ages, so nothing in the template reads
 * `position` directly (that re-rendered this whole screen 60×/s). Only `windowStart` and
 * `nearest` — which change once per photo — are rendered; opacity and the slider are written
 * by frame directives.
 */
const windowStart = computed(() => Math.floor(position.value))
/** Photos kept in the DOM: today's view, the pair being blended, and the next one (preloading). */
const inWindow = (i) => i === 0 || (i >= windowStart.value && i <= windowStart.value + 2)
const vFade = frameDirective((el, i) => (el.style.opacity = i === 0 ? 1 : layerOpacity(i, position.value)))
const vPlayhead = frameDirective((el) => {
  el.value = String(Math.round(position.value * 100))
  el.style.setProperty('--fill', `${lastIndex.value ? (position.value / lastIndex.value) * 100 : 0}%`)
})
let frame = null
let lastTick = 0
function tick(now) {
  const dt = Math.min(64, now - lastTick) // a backgrounded tab must not skip ahead
  lastTick = now
  position.value = advancePosition(position.value, dt, lastIndex.value)
  if (position.value >= lastIndex.value) {
    timePlaying.value = false // reached the oldest photo
    frame = null
    return
  }
  frame = requestAnimationFrame(tick)
}
function playTime() {
  if (position.value >= lastIndex.value) position.value = 0 // replay from today
  timePlaying.value = true
  lastTick = performance.now()
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(tick)
}
function pauseTime() {
  timePlaying.value = false
  cancelAnimationFrame(frame)
  frame = null
}
const toggleTime = () => (timePlaying.value ? pauseTime() : playTime())
/** Dragging the year bar takes over from playback. */
function scrubTime(value) {
  pauseTime()
  position.value = value / 100
}
const narration = computed(() => localizeNarration(site.value.id, locale.value))

const detected = ref(false)

// ---- look around: tilt the phone or drag the photo; bubbles sit on a closer layer (parallax) ----
const stage = ref(null)
const look = useLookAround({ frame: () => stage.value })
const vLook = look.directive
const ui = useUiStore()
let hinted = false
watch(detected, (now) => {
  if (!now || hinted) return
  hinted = true // once per visit
  ui.showToast(t('ar.lookAround'), { duration: 2600 })
})
const helpOpen = ref(false)

// ---- 360° Street View of the landmark today (Google), instead of the photo stack ----
const can360 = isGoogleMapsConfigured()
const view360 = ref(false)
/** 'loading' until the panorama shows */
const pano = ref('loading')
let panoHinted = false
function toggle360() {
  if (view360.value) return (view360.value = false)
  pauseTime() // the year bar is hidden while you look around today's street
  openPanel.value = null
  pano.value = 'loading'
  view360.value = true
}
function onPanoReady() {
  pano.value = 'ready'
  if (panoHinted) return
  panoHinted = true
  ui.showToast(t('ar.view360Hint'), { duration: 2600 })
}
function onPanoUnavailable() {
  if (!view360.value) return
  view360.value = false
  ui.showToast(t('ar.view360None', { name: site.value.shortName }), { duration: 3000 })
}
const chooserOpen = ref(false)
const openPanel = ref(null) // 'info' | 'audio' | 'photos' | null
const positions = reactive(structuredClone(DEFAULT_HOTSPOTS))

const hotspots = computed(() => [
  { key: 'info', label: t('ar.about'), icon: 'info' },
  { key: 'audio', label: isNarrating.value ? t('audio.pause') : t('ar.listen'), icon: isNarrating.value ? 'pause' : 'headphones' },
  { key: 'photos', label: t('ar.photos'), icon: 'image' },
])
const isNarrating = computed(() => player.playing && player.siteId === site.value.id)

function togglePanel(key) {
  // Listen is a play/pause control, not a card: one tap pauses (or resumes) the narration.
  if (key === 'audio') return toggleNarration()
  openPanel.value = openPanel.value === key ? null : key
}
function toggleNarration() {
  player.load(site.value.id)
  player.toggle()
}

// ---- simulated detection; re-scan whenever the landmark changes ----
let scanTimer
function scan() {
  clearTimeout(scanTimer)
  detected.value = false
  openPanel.value = null
  player.pause() // the previous landmark's tour stops while the new one is found
  pauseTime()
  view360.value = false
  position.value = 0
  Object.assign(positions, structuredClone(DEFAULT_HOTSPOTS))
  scanTimer = setTimeout(() => (detected.value = true), SCAN_DURATION_MS)
}
watch(() => site.value.id, scan, { immediate: true })

// Once the landmark is recognised, its audio tour starts by itself; Listen pauses it (WCAG 1.4.2:
// sound that starts on its own must be easy to stop). Leaving AR stops it.
watch(detected, (now) => {
  if (!now) return
  player.load(site.value.id)
  if (!player.playing) player.play()
  playTime() // …and the building starts to age: listen while you watch it go back in time
})
onBeforeUnmount(() => {
  clearTimeout(scanTimer)
  player.pause()
  cancelAnimationFrame(frame)
})

function chooseSite(id, dismiss) {
  dismiss()
  router.replace({ name: 'ar', params: { id } })
}

/** Exit goes back to where AR was opened from (site page, map…); opened directly → Home. */
const exit = () => (window.history.state?.back ? router.back() : router.replace({ name: 'home' }))
</script>

<template>
  <div ref="stage" class="ar-camera" v-on="look.handlers">
    <div v-show="!view360 || pano !== 'ready'" v-look="[1, LOOK_SCALE]" class="ar-camera__world">
      <Transition name="feed" mode="out-in">
        <div :key="site.id" class="ar-camera__stack">
          <!-- stacked from today to oldest; only the two photos either side of `position` show.
               Only today + those two (+ the next, preloading) are in the DOM: with 10+ photos per
               site, keeping every full-size photo decoded and composited made AR slow down. -->
          <template v-for="(p, i) in timeline" :key="p.image">
          <img
            v-if="inWindow(i)"
            class="ar-camera__feed"
            :src="p.image"
            :alt="i === nearest ? (i === 0 ? t('ar.cameraAlt', { name: site.name }) : t('compare.photoAlt', { name: site.name, year: yearLabel(p) })) : ''"
            :aria-hidden="i === nearest ? undefined : 'true'"
            v-fade="i"
            draggable="false"
          />
          </template>
        </div>
      </Transition>
    </div>
    <!-- fades in over the photo once loaded, fades out back to it -->
    <Transition name="feed">
      <StreetView360
        v-if="view360"
        :key="site.id"
        data-no-look
        :target="site.coordinates"
        @ready="onPanoReady"
        @unavailable="onPanoUnavailable"
      />
    </Transition>
    <template v-if="!view360">
      <div class="ar-camera__veil" />
      <div class="reticle" aria-hidden="true"><i /><i /><i /><i /></div>
      <div v-if="!detected" class="scanline" aria-hidden="true" />
    </template>

    <div class="ar-camera__top" data-no-look>
      <!-- same control, same place as AR navigation: a glass Back button -->
      <IconButton variant="glass" icon="back" :label="t('ar.exit')" @click="exit" />
      <span class="ar-camera__actions">
        <!-- iOS asks before sharing motion; elsewhere tilt works straight away -->
        <!-- today's street in 360°: Google Street View (only when a Maps key is configured) -->
        <IconButton
          v-if="can360 && detected"
          variant="glass"
          icon="pano"
          :label="t('ar.view360')"
          :pressed="view360"
          @click="toggle360"
        />
        <IconButton variant="glass" icon="help" :label="t('ar.help')" @click="helpOpen = true" />
      </span>
    </div>

    <ArStatusPill v-if="view360" data-toast-below class="ar-camera__status" :spinner="pano === 'loading'">
      {{ pano === 'loading' ? t('ar.view360Loading') : `${t('ar.view360Status')} · ${site.shortName}` }}
    </ArStatusPill>
    <ArStatusPill v-else data-toast-below class="ar-camera__status" :tone="detected ? 'success' : 'default'" :spinner="!detected">
      {{ detected ? `${t('ar.detected')} · ${site.shortName}` : t('ar.scanning') }}
    </ArStatusPill>

    <div v-if="detected && !view360" v-look="1.35" class="ar-camera__hotspots">
      <ArBubble
        v-for="spot in hotspots"
        :key="spot.key"
        :icon="spot.icon"
        :label="spot.label"
        :position="positions[spot.key]"
        :active="openPanel === spot.key"
        @select="togglePanel(spot.key)"
        @move="(p) => (positions[spot.key] = p)"
      />
    </div>

    <!-- Bottom dock: the info card stacks on the through-time card, so larger text never overlaps -->
    <div class="ar-camera__dock">
    <Transition name="sheet">
      <section
        v-if="openPanel"
        class="panel"
        data-no-look
        :style="{ '--origin-x': `${positions[openPanel].x}%` }"
        :aria-label="hotspots.find((h) => h.key === openPanel)?.label"
      >
        <IconButton class="panel__close" icon="close" :label="t('common.close')" variant="sand" @click="openPanel = null" />

        <template v-if="openPanel === 'info'">
          <p class="t-caption">{{ site.categoryLabel }} · {{ t('common.built', { year: site.builtYear }) }}</p>
          <h2 class="t-h1 panel__title">{{ site.name }}</h2>
          <p class="t-body">{{ site.description }}</p>
          <BaseButton block class="panel__cta" :to="{ name: 'site', params: { id: site.id } }">{{ t('ar.openFull') }}</BaseButton>
        </template>

        <template v-else-if="openPanel === 'audio'">
          <p class="t-caption">{{ t('ar.audioTour') }}</p>
          <h2 class="t-h1 panel__title">{{ narration.title }}</h2>
          <p class="t-body">{{ narration.transcript[0] }}</p>
          <BaseButton block class="panel__cta" :icon="isNarrating ? 'pause' : 'play'" @click="toggleNarration">
            {{ isNarrating ? t('ar.pauseNarration') : t('ar.playNarration') }}
          </BaseButton>
        </template>

        <template v-else>
          <p class="t-caption">{{ t('ar.photos') }}</p>
          <h2 class="t-h1 panel__title">{{ site.name }}</h2>
          <div class="panel__thumbs">
            <RouterLink
              v-for="(photo, i) in site.gallery"
              :key="photo.image"
              class="panel__thumb pressable-card"
              :to="{ name: 'gallery', params: { id: site.id, index: i } }"
              :aria-label="photo.caption"
            >
              <img :src="photo.thumb ?? photo.image" alt="" loading="lazy" />
            </RouterLink>
          </div>
        </template>
      </section>
    </Transition>

    <!-- Through time: a year bar instead of a separate page. Leaves downward for 360°, returns the same way. -->
    <Transition name="dock-card">
    <section v-show="!view360" class="timeline text-zoom" data-no-look :aria-label="t('compare.title')">
      <p class="timeline__head">
        <b>{{ yearLabel(shownPhoto) }}</b>
        <span v-if="shownPhoto.archival" class="timeline__tag">{{ t('compare.archival') }}</span>
        · {{ shownPhoto.title || site.name }}
      </p>
      <p class="timeline__text" aria-live="polite">{{ shownPhoto.text }}</p>
      <div class="timeline__controls">
        <!-- playback can always be paused (WCAG 2.2.2) -->
        <button
          type="button"
          class="timeline__play pressable"
          :aria-label="timePlaying ? t('audio.pause') : t('audio.play')"
          :aria-pressed="timePlaying"
          @click="toggleTime"
        >
          <AppIcon :name="timePlaying ? 'pause' : 'play'" :size="18" :filled="true" />
        </button>
        <input
          class="timeline__slider slider"
          type="range"
          min="0"
          :max="lastIndex * 100"
          v-playhead
          :aria-label="t('compare.timeline', { name: site.name })"
          :aria-valuetext="`${yearLabel(shownPhoto)} · ${shownPhoto.title || site.name}`"
          @pointerdown="pauseTime"
          @input="scrubTime(Number($event.target.value))"
        />
      </div>
      <div class="timeline__ends" aria-hidden="true">
        <span>{{ yearLabel(timeline[0]) }}</span>
        <span class="timeline__ticks">
          <i v-for="(p, i) in timeline" :key="p.image" :class="{ 'is-on': i === nearest }" />
        </span>
        <span>{{ yearLabel(timeline[lastIndex]) }}</span>
      </div>
    </section>
    </Transition>
    </div>

    <!-- "Not this building?" lives in help, keeping the camera view clear -->
    <Transition name="materialize">
      <ArHelpOverlay
        v-if="helpOpen"
        :can-switch="detected"
        @close="helpOpen = false"
        @choose="helpOpen = false; chooserOpen = true"
      />
    </Transition>

    <BottomSheet
      v-if="chooserOpen"
      :label="t('ar.chooseSite')"
      :title="t('ar.chooseSite')"
      :subtitle="t('ar.chooseSubtitle')"
      @close="chooserOpen = false"
    >
      <template #default="{ dismiss }">
        <ul class="chooser">
          <li v-for="option in sites" :key="option.id">
            <button
              type="button"
              class="chooser__item pressable-card"
              :class="{ 'is-selected': option.id === site.id }"
              :aria-current="option.id === site.id"
              @click="chooseSite(option.id, dismiss)"
            >
              <img :src="option.image" alt="" loading="lazy" />
              <span>
                <b>{{ option.name }}</b>
                <!-- say where the time is measured from: the walker, or the default origin -->
                <small>{{ option.area }} · {{ t('common.minWalk', { n: location.distanceTo(option).minutes }) }} {{ t(location.originLabelKey) }}</small>
              </span>
              <AppIcon v-if="option.id === site.id" name="check" :size="18" :stroke-width="2.6" />
            </button>
          </li>
        </ul>
      </template>
    </BottomSheet>
  </div>
</template>

<style scoped>
.ar-camera {
  position: relative;
  overflow: hidden;
  background: var(--camera-bg);
  touch-action: none;
}
.ar-camera__world,
.ar-camera__hotspots {
  position: absolute;
  inset: 0;
  will-change: transform; /* moved every frame by tilt / drag */
}
.ar-camera__hotspots {
  z-index: 4;
}
.ar-camera__feed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
}
.ar-camera__actions {
  display: flex;
  gap: var(--s-2);
}
.ar-camera__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 26%, transparent 72%, var(--photo-veil-top));
  pointer-events: none;
}
.reticle {
  position: absolute;
  inset: 26% 14% 32%;
  pointer-events: none;
}
.reticle i {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 3px solid var(--ar-400);
  border-radius: var(--r-xs);
}
.reticle i:nth-child(1) { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.reticle i:nth-child(2) { top: 0; right: 0; border-left: 0; border-bottom: 0; }
.reticle i:nth-child(3) { bottom: 0; left: 0; border-right: 0; border-top: 0; }
.reticle i:nth-child(4) { bottom: 0; right: 0; border-left: 0; border-top: 0; }
/* The box spans the travel range; the line inside moves with transform (compositor only, no layout). */
.scanline {
  position: absolute;
  top: 27%;
  left: 14%;
  right: 14%;
  height: 40%;
  container-type: size;
  pointer-events: none;
}
.scanline::after {
  content: '';
  display: block;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ar-400), transparent);
  box-shadow: 0 0 12px var(--ar-400);
  animation: scan 1.4s linear infinite;
  will-change: transform;
}
.ar-camera__top {
  position: absolute;
  top: var(--chrome-top);
  left: var(--gutter);
  right: var(--gutter);
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ar-camera__status {
  position: absolute;
  top: calc(var(--chrome-top) + 58px);
  left: 50%;
  z-index: 5;
  transform: translateX(-50%);
}
.ar-camera__dock {
  position: absolute;
  top: calc(var(--chrome-top) + 110px); /* below the status pill: the card shrinks to fit, then scrolls */
  left: var(--s-3);
  right: var(--s-3);
  bottom: var(--s-3);
  z-index: 7;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--s-3);
  pointer-events: none; /* the empty space above the cards still looks around */
}
.ar-camera__dock > * {
  pointer-events: auto;
}
.panel {
  position: relative;
  min-height: 0;
  flex-shrink: 1;
  overflow-y: auto;
  padding: var(--s-5);
  border-radius: var(--r-lg);
  background: var(--cream);
  color: var(--ink-700);
  box-shadow: var(--e-2);
}
.panel__close {
  position: absolute;
  top: 6px;
  right: 6px; /* keeps IconButton's 44px */
}
.panel__title {
  margin: 4px 44px var(--s-2) 0;
}
.panel__cta {
  margin-top: var(--s-4);
}
.panel__thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-2);
}
.panel__thumb {
  display: block;
  overflow: hidden;
  border-radius: var(--r-sm);
}
.panel__thumbs img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--r-sm);
}
.ar-camera__stack {
  position: absolute;
  inset: 0;
}
/* ---- through-time card ---- */
.timeline {
  flex-shrink: 0;
  padding: var(--s-3) var(--s-4) var(--s-2);
  border-radius: var(--r-lg);
  background: var(--cream);
  box-shadow: var(--e-2);
}
.timeline__head {
  overflow: hidden;
  font: var(--t-label-sm);
  color: var(--ink-700);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.timeline__head b {
  font: var(--t-title);
  color: var(--ink-900);
}
.timeline__tag {
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  background: var(--brand-50);
  color: var(--brand-600);
  font: var(--t-micro);
  font-weight: 700;
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  vertical-align: 2px;
}
.timeline__text {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  font: var(--t-body-sm);
  color: var(--ink-900);
}
.timeline__controls {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.timeline__play {
  width: var(--hit);
  height: var(--hit);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: calc(-1 * var(--s-2));
  border-radius: 50%;
  color: var(--brand-600);
}
.timeline__slider {
  flex: 1;
  min-width: 0;
}
.timeline__ends {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin-top: -6px;
  font: var(--t-micro);
  color: var(--ink-700);
}
.timeline__ticks {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
}
.timeline__ticks i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--outline);
  transition: background var(--dur) var(--ease);
}
.timeline__ticks i.is-on {
  background: var(--brand-600);
}
.chooser {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.chooser__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3) var(--s-2) var(--s-2);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  text-align: left;
  color: var(--brand-600);
}
.chooser__item.is-selected {
  border-color: var(--brand-600);
  background: var(--brand-50);
}
.chooser__item img {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
  object-fit: cover;
}
.chooser__item span {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.chooser__item b {
  font: var(--t-card-title);
  color: var(--ink-900);
}
.chooser__item small {
  font: var(--t-small);
  color: var(--ink-500);
}
.feed-enter-active,
.feed-leave-active {
  transition: opacity var(--dur) var(--ease);
}
.feed-enter-from,
.feed-leave-to {
  opacity: 0;
}
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
/* The card grows out of (and shrinks back into) the bubble that opened it — anchored to its source. */
.panel {
  transform-origin: var(--origin-x, 50%) top;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(calc(-16px * var(--motion))) scale(calc(1 - 0.12 * var(--motion)));
}
.dock-card-enter-active,
.dock-card-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.dock-card-enter-from,
.dock-card-leave-to {
  opacity: 0;
  transform: translateY(calc(100% * var(--motion))); /* slides out below the screen edge, back up the same path */
}
@media (prefers-reduced-motion: reduce) {
  .scanline {
    display: none; /* the reticle alone shows it's scanning */
  }
}
@keyframes scan {
  from { transform: translateY(0); }
  to { transform: translateY(100cqh); }
}
@keyframes fade {
  from { opacity: 0; }
}
</style>
