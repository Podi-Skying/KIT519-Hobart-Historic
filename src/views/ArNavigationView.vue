<script setup>
import { computed, ref } from 'vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BottomSheet from '@/components/base/BottomSheet.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import ArStatusPill from '@/components/ar/ArStatusPill.vue'
import { AR_NAVIGATION_IMAGE, getSiteById } from '@/data/sites'
import { useTripStore } from '@/stores/trip'
import { useGoBack } from '@/composables/useGoBack'

const props = defineProps({
  id: { type: Number, required: true },
})

const trip = useTripStore()
const site = computed(() => getSiteById(props.id))
const arrived = ref(false)
const close = useGoBack({ name: 'navigate', params: { id: props.id } })
</script>

<template>
  <div class="ar-nav">
    <img class="ar-nav__feed" :src="AR_NAVIGATION_IMAGE" alt="Street ahead, seen through the camera" fetchpriority="high" />
    <div class="ar-nav__veil" />

    <div class="ar-nav__top">
      <IconButton variant="glass" icon="close" label="Close AR navigation" @click="close" />
      <BaseButton variant="secondary" size="sm" icon="map" :to="{ name: 'navigate-map', params: { id } }">Map</BaseButton>
    </div>

    <ArStatusPill icon="up" class="ar-nav__instruction">Continue 120 m</ArStatusPill>

    <div class="ar-nav__arrows" aria-hidden="true">
      <svg v-for="n in 3" :key="n" width="72" height="44" viewBox="0 0 72 44" :style="{ animationDelay: `${(n - 1) * 0.15}s` }">
        <path d="M4 40 L36 6 L68 40 L36 27 Z" fill="rgba(56,189,248,.9)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" />
      </svg>
    </div>

    <RouterLink :to="{ name: 'navigate-map', params: { id } }" class="ar-nav__minimap" aria-label="Open full map">
      <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" fill="var(--map-land)" />
        <path d="M0 40 L100 35 M0 72 L100 68 M45 0 L48 100" stroke="var(--map-road)" stroke-width="6" />
        <path d="M22 86 C35 60 60 45 80 18" stroke="var(--brand-600)" stroke-width="4" fill="none" stroke-linecap="round" />
        <circle cx="22" cy="86" r="6" fill="var(--info-600)" stroke="#fff" stroke-width="2.5" />
        <circle cx="80" cy="18" r="5" fill="var(--brand-600)" stroke="#fff" stroke-width="2" />
      </svg>
    </RouterLink>

    <section class="ar-nav__summary">
      <div>
        <p class="ar-nav__eta">{{ trip.minutesTo(site) }} min</p>
        <p class="t-small muted">{{ site.name }}</p>
      </div>
      <BaseButton @click="arrived = true">Simulate arrival</BaseButton>
    </section>

    <BottomSheet v-if="arrived" label="Arrived" @close="arrived = false">
      <div class="arrived">
        <span class="arrived__icon"><AppIcon name="check" :size="28" :stroke-width="2.6" /></span>
        <h2 class="t-h1">You've arrived</h2>
        <p class="t-body">{{ site.name }} is right in front of you.</p>
        <BaseButton block icon="ar" :to="{ name: 'ar' }">Scan with AR</BaseButton>
        <BaseButton block variant="secondary" :to="{ name: 'site', params: { id } }">View details</BaseButton>
      </div>
    </BottomSheet>
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
  width: 104px;
  height: 104px;
  overflow: hidden;
  border: 3px solid var(--paper);
  border-radius: var(--r-lg);
  box-shadow: var(--e-2);
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
.arrived {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  text-align: center;
}
.arrived__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--success-50);
  color: var(--success-600);
}
.arrived p {
  margin-bottom: var(--s-2);
}
@keyframes bob {
  50% {
    transform: translateY(-6px);
  }
}
</style>
