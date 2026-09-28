<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'

const TABS = [
  { key: 'home', icon: 'home', to: { name: 'home' } },
  { key: 'map', icon: 'map', to: { name: 'map' } },
  { key: 'ar', icon: 'ar', to: { name: 'ar' } },
  { key: 'weather', icon: 'weather', to: { name: 'weather' } },
]

const route = useRoute()
const { t } = useI18n()
/** One highlight that travels to the active tab (spatial continuity), instead of one per tab.
 *  Icons never change on their own: live weather lives on the Weather page, not in the bar. */
const activeIndex = computed(() => TABS.findIndex((tab) => tab.key === route.meta.tab))
</script>

<template>
  <nav class="tab-bar no-print text-zoom" data-req="NFR5" :aria-label="t('tabs.main')">
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
      <AppIcon :name="tab.icon" :size="24" :stroke-width="route.meta.tab === tab.key ? 2.4 : 2" />
      <span>{{ t(`tabs.${tab.key}`) }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  flex-shrink: 0;
  display: flex;
  padding-bottom: var(--safe-bottom); /* home-indicator gap: real inset on phones, 14px in the mock-up */
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
/* Selection lives inside the bar (iOS): tinted icon + label on a soft capsule behind the icon.
   Nothing sticks out of the bar's top edge, so it never collides with the map / Street View
   attribution above. One capsule slides from the old tab to the new one (reduced motion: instant). */
.tab-bar {
  position: relative;
}
.tab-bar__indicator {
  position: absolute;
  top: 6px;
  left: 0;
  width: calc(100% / 4);
  height: 32px;
  transition: transform calc(var(--dur-page) * var(--motion)) var(--ease-page);
  pointer-events: none;
}
.tab-bar__indicator::before {
  content: '';
  position: absolute;
  inset: 0 calc(50% - 28px);
  border-radius: var(--r-pill);
  background: var(--brand-50);
}
.tab > * {
  position: relative; /* above the capsule */
}
.tab.is-active {
  color: var(--brand-600);
}
</style>
