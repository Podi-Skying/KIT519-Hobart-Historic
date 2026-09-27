<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import CrossfadeIcon from '@/components/base/CrossfadeIcon.vue'
import { useWeatherStore } from '@/stores/weather'

const TABS = [
  { key: 'home', icon: 'home', to: { name: 'home' } },
  { key: 'map', icon: 'map', to: { name: 'map' } },
  { key: 'ar', icon: 'ar', to: { name: 'ar' } },
  { key: 'weather', icon: 'weather', to: { name: 'weather' } },
]

const route = useRoute()
const { t } = useI18n()
/** The Weather tab shows the current (simulated) condition, fading as it changes. */
const weather = useWeatherStore()

/** One indicator that travels to the active tab (spatial continuity), instead of one per tab. */
const activeIndex = computed(() => TABS.findIndex((tab) => tab.key === route.meta.tab))
</script>

<template>
  <nav class="tab-bar no-print text-zoom" :aria-label="t('tabs.main')">
    <span
      v-if="activeIndex >= 0"
      class="tab-bar__indicator"
      aria-hidden="true"
      :style="{ transform: `translateX(${activeIndex * 100}%)` }"
    />
    <RouterLink
      v-for="tab in TABS"
      :key="tab.key"
      :to="tab.to"
      class="tab pressable-dim"
      :class="{ 'is-active': route.meta.tab === tab.key }"
      :aria-current="route.meta.tab === tab.key ? 'page' : undefined"
    >
      <CrossfadeIcon v-if="tab.key === 'weather'" :name="weather.icon" :size="24" subtle />
      <AppIcon v-else :name="tab.icon" :size="24" />
      <span>{{ t(`tabs.${tab.key}`) }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  flex-shrink: 0;
  display: flex;
  padding-bottom: 14px;
  background: var(--paper);
  border-top: 1px solid var(--sand);
}
.tab {
  position: relative;
  flex: 1;
  min-height: var(--hit);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding-top: 10px;
  color: var(--ink-500);
  font: var(--t-micro);
  transition: color var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
/* Active indicator: short burgundy bar on the top edge. A single bar slides from the old tab
   to the new one, so the eye follows where you went (reduced motion: it moves instantly). */
.tab-bar {
  position: relative;
}
.tab-bar__indicator {
  position: absolute;
  top: -1px;
  left: 0;
  width: calc(100% / 4);
  height: 3px;
  transition: transform calc(var(--dur-page) * var(--motion)) var(--ease-page);
  pointer-events: none;
}
.tab-bar__indicator::before {
  content: '';
  position: absolute;
  inset: 0 22%;
  border-radius: 0 0 var(--r-xs) var(--r-xs);
  background: var(--brand-600);
}
.tab.is-active {
  color: var(--brand-600);
}
</style>
