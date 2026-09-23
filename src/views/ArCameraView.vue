<script setup>
/**
 * AR camera (simulated): scans for ~1.6 s, "detects" the demo landmark and
 * shows draggable hotspots for info, audio and photos.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ArStatusPill from '@/components/ar/ArStatusPill.vue'
import ArBubble from '@/components/ar/ArBubble.vue'
import ArHelpOverlay from '@/components/ar/ArHelpOverlay.vue'
import { AR_DEMO_SITE_ID, getSiteById } from '@/data/sites'
import { usePlayerStore } from '@/stores/player'

const SCAN_DURATION_MS = 1600

const router = useRouter()
const player = usePlayerStore()
const site = getSiteById(AR_DEMO_SITE_ID)

const detected = ref(false)
const helpOpen = ref(false)
const openPanel = ref(null) // 'info' | 'audio' | 'photos' | null

const hotspots = reactive([
  { key: 'info', label: 'About', icon: 'info', position: { x: 74, y: 44 } },
  { key: 'audio', label: 'Listen', icon: 'headphones', position: { x: 28, y: 52 } },
  { key: 'photos', label: 'Photos', icon: 'image', position: { x: 64, y: 64 } },
])

const audioIcon = computed(() => (player.playing && player.siteId === site.id ? 'pause' : 'headphones'))

function togglePanel(key) {
  openPanel.value = openPanel.value === key ? null : key
}

function toggleNarration() {
  player.load(site.id)
  player.toggle()
}

let scanTimer
onMounted(() => {
  scanTimer = setTimeout(() => (detected.value = true), SCAN_DURATION_MS)
})
onBeforeUnmount(() => clearTimeout(scanTimer))

const exit = () => router.push({ name: 'home' })
</script>

<template>
  <div class="ar-camera">
    <img class="ar-camera__feed" :src="site.image" alt="Simulated camera view" />
    <div class="ar-camera__veil" />

    <div class="reticle" aria-hidden="true"><i /><i /><i /><i /></div>
    <div v-if="!detected" class="scanline" aria-hidden="true" />

    <div class="ar-camera__top">
      <BaseButton variant="secondary" size="sm" icon="back" @click="exit">Exit</BaseButton>
      <IconButton variant="glass" icon="help" label="How AR mode works" @click="helpOpen = true" />
    </div>

    <ArStatusPill class="ar-camera__status" :tone="detected ? 'success' : 'default'" :spinner="!detected">
      {{ detected ? 'Landmark detected' : 'Scanning for landmarks' }}
    </ArStatusPill>

    <template v-if="detected">
      <div class="landmark-label">
        <b>{{ site.name }}</b>
        <small>Built {{ site.builtYear }} · {{ site.area }} · drag bubbles to move</small>
      </div>
      <ArBubble
        v-for="spot in hotspots"
        :key="spot.key"
        :icon="spot.key === 'audio' ? audioIcon : spot.icon"
        :label="spot.label"
        :position="spot.position"
        :active="openPanel === spot.key"
        @select="togglePanel(spot.key)"
        @move="(p) => (spot.position = p)"
      />
    </template>

    <Transition name="sheet">
      <section v-if="openPanel" class="panel" :aria-label="openPanel">
        <IconButton class="panel__close" icon="close" label="Close" variant="sand" @click="openPanel = null" />

        <template v-if="openPanel === 'info'">
          <p class="t-caption">{{ site.categoryLabel }} · Built {{ site.builtYear }}</p>
          <h2 class="t-h1 panel__title">{{ site.name }}</h2>
          <p class="t-body">{{ site.description }}</p>
          <BaseButton block class="panel__cta" :to="{ name: 'site', params: { id: site.id } }">Open full page</BaseButton>
        </template>

        <template v-else-if="openPanel === 'audio'">
          <p class="t-caption">Audio tour</p>
          <h2 class="t-h1 panel__title">{{ player.narration.title }}</h2>
          <p class="t-body">{{ player.narration.transcript[0] }}</p>
          <BaseButton block class="panel__cta" :icon="player.playing ? 'pause' : 'play'" @click="toggleNarration">
            {{ player.playing ? 'Pause' : 'Play' }} narration
          </BaseButton>
        </template>

        <template v-else>
          <p class="t-caption">Photos</p>
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

    <BaseButton class="ar-camera__compare" block :to="{ name: 'ar-compare' }">
      <AppIcon name="clock" :size="18" /> Compare today with {{ site.timeTravel.pastYear }}
    </BaseButton>

    <ArHelpOverlay v-if="helpOpen" @close="helpOpen = false" />
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
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 26%, transparent 72%, rgba(44, 36, 23, 0.5));
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
.landmark-label {
  position: absolute;
  top: 170px;
  left: 50%;
  z-index: 3;
  padding: var(--s-2) var(--s-4);
  border-radius: var(--r-md);
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--cream);
  text-align: center;
  white-space: nowrap;
  transform: translateX(-50%);
  animation: fade var(--dur-slow) var(--ease);
}
.landmark-label b {
  display: block;
  font: 700 18px var(--font-heading);
}
.landmark-label small {
  font: 500 12px var(--font-body);
  opacity: 0.85;
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
.ar-camera__compare {
  position: absolute;
  left: var(--gutter);
  bottom: 18px;
  z-index: 7;
  width: calc(100% - var(--gutter) * 2);
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
