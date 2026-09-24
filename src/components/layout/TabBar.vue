<script setup>
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
</script>

<template>
  <nav class="tab-bar no-print text-zoom" :aria-label="t('tabs.main')">
    <RouterLink
      v-for="tab in TABS"
      :key="tab.key"
      :to="tab.to"
      class="tab"
      :class="{ 'is-active': route.meta.tab === tab.key }"
      :aria-current="route.meta.tab === tab.key ? 'page' : undefined"
    >
      <CrossfadeIcon v-if="tab.key === 'weather'" :name="weather.icon" :size="24" />
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
  font: 600 11px var(--font-label);
  transition: color var(--dur) var(--ease);
}
/* Active indicator: short burgundy bar on the top edge */
.tab::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 22%;
  right: 22%;
  height: 3px;
  border-radius: 0 0 3px 3px;
  background: var(--brand-600);
  transform: scaleX(0);
  transition: transform var(--dur) var(--ease);
}
.tab.is-active {
  color: var(--brand-600);
}
.tab.is-active::before {
  transform: scaleX(1);
}
</style>
