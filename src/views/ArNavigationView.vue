<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ArStatusPill from '@/components/ar/ArStatusPill.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import ArrivalSheet from '@/components/map/ArrivalSheet.vue'
import { useContent } from '@/i18n/content'
import { formatMeters } from '@/lib/format'
import { maneuverIcon, nextGuidance } from '@/lib/guidance'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useTripStore } from '@/stores/trip'
import { useLocationStore } from '@/stores/location'
import { useGoBack } from '@/composables/useGoBack'

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
onMounted(() => location.start())
const arrived = ref(false)
// Reaching the destination opens the arrival sheet by itself (location-triggered content).
watch(() => guidance.value.arrived, (now) => now && (arrived.value = true))
const close = useGoBack({ name: 'navigate', params: { id: props.id } })
</script>

<template>
  <div class="ar-nav">
    <!-- Simulated camera feed: the approach to this particular site -->
    <img class="ar-nav__feed" :src="site.arApproachImage" :alt="t('arNav.feedAlt', { name: site.name })" fetchpriority="high" />
    <div class="ar-nav__veil" />

    <div class="ar-nav__top">
      <IconButton variant="glass" icon="close" :label="t('arNav.close')" @click="close" />
      <BaseButton variant="secondary" size="sm" icon="map" :to="{ name: 'navigate-map', params: { id } }">{{ t('arNav.map') }}</BaseButton>
    </div>

    <ArStatusPill :icon="maneuverIcon(guidance.maneuver)" class="ar-nav__instruction">{{ instruction }}</ArStatusPill>

    <div class="ar-nav__arrows" aria-hidden="true">
      <svg v-for="n in 3" :key="n" width="72" height="44" viewBox="0 0 72 44" :style="{ animationDelay: `${(n - 1) * 0.15}s` }">
        <path d="M4 40 L36 6 L68 40 L36 27 Z" fill="rgba(56,189,248,.9)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" />
      </svg>
    </div>

    <RouterLink :to="{ name: 'navigate-map', params: { id } }" class="ar-nav__minimap" :aria-label="t('arNav.openMap')">
      <SiteMap
        :sites="[site]"
        :selected-id="site.id"
        :route-path="walk.path.value"
        :route-type="trip.routeTypeConfig"
        :real-route="walk.isRealRoute.value"
        :amenities="walk.amenityMarkers.value"
        :user="user"
        :start="location.origin"
        fit="route"
        :interactive="false"
        :show-labels="false"
        :padding="{ top: 14, right: 14, bottom: 14, left: 14 }"
        :box="{ x: [15, 85], y: [15, 85] }"
      />
    </RouterLink>

    <section class="ar-nav__summary text-zoom">
      <div>
        <p class="ar-nav__eta">{{ t('common.minutes', { n: walk.minutes.value }) }}</p>
        <p class="t-small muted">{{ site.name }}</p>
      </div>
      <BaseButton @click="arrived = true">{{ t('arNav.simulate') }}</BaseButton>
    </section>

    <ArrivalSheet v-if="arrived" :site="site" primary="ar" @close="arrived = false" />
  </div>
</template>

<style scoped>
.ar-nav {
  position: relative;
  overflow: hidden;
  background: #000;
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
  top: 50px;
  left: var(--gutter);
  right: var(--gutter);
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ar-nav__instruction {
  position: absolute;
  top: 108px;
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
.ar-nav__minimap {
  position: absolute;
  right: var(--gutter);
  bottom: 150px;
  z-index: 2;
  width: 120px;
  height: 120px;
  overflow: hidden;
  border: 3px solid var(--paper);
  border-radius: var(--r-lg);
  box-shadow: var(--e-2);
}
.ar-nav__minimap > * {
  pointer-events: none; /* the whole thumbnail is a link to the full map */
}
.ar-nav__summary {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-4);
  padding: 18px var(--gutter) var(--s-6);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  background: var(--cream);
  box-shadow: var(--e-3);
}
.ar-nav__eta {
  font: 700 26px var(--font-heading);
  color: var(--success-600);
}
@keyframes bob {
  50% {
    transform: translateY(-6px);
  }
}
</style>
