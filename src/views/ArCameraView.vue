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
import { localizeNarration, useContent } from '@/i18n/content'
import { siteTimeline } from '@/lib/sites'
import { usePlayerStore } from '@/stores/player'
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
/** Photos in the site's through-time viewer. */
const photoCount = computed(() => siteTimeline(site.value).length)
const narration = computed(() => localizeNarration(site.value.id, locale.value))

const detected = ref(false)
const helpOpen = ref(false)
const chooserOpen = ref(false)
const openPanel = ref(null) // 'info' | 'audio' | 'photos' | null
const positions = reactive(structuredClone(DEFAULT_HOTSPOTS))

const hotspots = computed(() => [
  { key: 'info', label: t('ar.about'), icon: 'info' },
  { key: 'audio', label: t('ar.listen'), icon: isNarrating.value ? 'pause' : 'headphones' },
  { key: 'photos', label: t('ar.photos'), icon: 'image' },
])
const isNarrating = computed(() => player.playing && player.siteId === site.value.id)

function togglePanel(key) {
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
  Object.assign(positions, structuredClone(DEFAULT_HOTSPOTS))
  scanTimer = setTimeout(() => (detected.value = true), SCAN_DURATION_MS)
}
watch(() => site.value.id, scan, { immediate: true })
onBeforeUnmount(() => clearTimeout(scanTimer))

function chooseSite(id, dismiss) {
  dismiss()
  router.replace({ name: 'ar', params: { id } })
}

const exit = () => router.push({ name: 'home' })
</script>

<template>
  <div class="ar-camera">
    <Transition name="feed" mode="out-in">
      <img :key="site.id" class="ar-camera__feed" :src="site.arImage" :alt="t('ar.cameraAlt', { name: site.name })" />
    </Transition>
    <div class="ar-camera__veil" />

    <div class="reticle" aria-hidden="true"><i /><i /><i /><i /></div>
    <div v-if="!detected" class="scanline" aria-hidden="true" />

    <div class="ar-camera__top">
      <BaseButton variant="secondary" size="sm" icon="back" @click="exit">{{ t('ar.exit') }}</BaseButton>
      <IconButton variant="glass" icon="help" :label="t('ar.help')" @click="helpOpen = true" />
    </div>

    <ArStatusPill class="ar-camera__status" :tone="detected ? 'success' : 'default'" :spinner="!detected">
      {{ detected ? `${t('ar.detected')} · ${site.shortName}` : t('ar.scanning') }}
    </ArStatusPill>

    <template v-if="detected">
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
    </template>

    <Transition name="sheet">
      <section v-if="openPanel" class="panel" :aria-label="hotspots.find((h) => h.key === openPanel)?.label">
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
              :to="{ name: 'gallery', params: { id: site.id, index: i } }"
              :aria-label="photo.caption"
            >
              <img :src="photo.image" alt="" loading="lazy" />
            </RouterLink>
          </div>
        </template>
      </section>
    </Transition>

    <div class="ar-camera__bottom">
      <BaseButton block :to="{ name: 'ar-compare', params: { id: site.id } }">
        <AppIcon name="clock" :size="18" /> {{ t('ar.compare', { n: photoCount }) }}
      </BaseButton>
    </div>

    <!-- "Not this building?" lives in help, keeping the camera view clear -->
    <ArHelpOverlay
      v-if="helpOpen"
      :can-switch="detected"
      @close="helpOpen = false"
      @choose="helpOpen = false; chooserOpen = true"
    />

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
              class="chooser__item"
              :class="{ 'is-selected': option.id === site.id }"
              :aria-current="option.id === site.id"
              @click="chooseSite(option.id, dismiss)"
            >
              <img :src="option.image" alt="" loading="lazy" />
              <span>
                <b>{{ option.name }}</b>
                <small>{{ option.area }} · {{ t('common.minWalk', { n: location.distanceTo(option).minutes }) }}</small>
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
  background: #000;
  touch-action: none;
}
.ar-camera__feed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ar-camera__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 26%, transparent 72%, rgba(44, 36, 23, 0.55));
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
  border-radius: 4px;
}
.reticle i:nth-child(1) { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.reticle i:nth-child(2) { top: 0; right: 0; border-left: 0; border-bottom: 0; }
.reticle i:nth-child(3) { bottom: 0; left: 0; border-right: 0; border-top: 0; }
.reticle i:nth-child(4) { bottom: 0; right: 0; border-left: 0; border-top: 0; }
.scanline {
  position: absolute;
  left: 14%;
  right: 14%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ar-400), transparent);
  box-shadow: 0 0 12px var(--ar-400);
  animation: scan 1.4s linear infinite;
}
.ar-camera__top {
  position: absolute;
  top: 50px;
  left: var(--gutter);
  right: var(--gutter);
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ar-camera__status {
  position: absolute;
  top: 108px;
  left: 50%;
  z-index: 5;
  transform: translateX(-50%);
}
.panel {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 84px;
  z-index: 8;
  max-height: 46%;
  overflow-y: auto;
  padding: var(--s-5);
  border-radius: var(--r-lg);
  background: var(--cream);
  color: var(--ink-700);
  box-shadow: var(--e-2);
}
.panel__close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
}
.panel__title {
  margin: 4px 40px var(--s-2) 0;
}
.panel__cta {
  margin-top: var(--s-4);
}
.panel__thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-2);
}
.panel__thumbs img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--r-sm);
}
.ar-camera__bottom {
  position: absolute;
  left: var(--gutter);
  right: var(--gutter);
  bottom: 18px;
  z-index: 7;
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
  font: 700 15px/20px var(--font-heading);
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
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
@keyframes scan {
  from { top: 27%; }
  to { top: 67%; }
}
@keyframes fade {
  from { opacity: 0; }
}
</style>
