<script setup>
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { NAVIGATION_MODES } from '@/data/navigation'
import { useContent } from '@/i18n/content'
import { useTripStore } from '@/stores/trip'

const props = defineProps({
  id: { type: Number, required: true },
})

const { t } = useI18n()
const { siteById } = useContent()
const trip = useTripStore()
const site = computed(() => siteById(props.id))
watchEffect(() => trip.setDestination(props.id))
</script>

<template>
  <AppPage>
    <PageHeader :fallback="{ name: 'map' }" />
    <div class="content">
      <p class="t-caption">{{ t('navModes.to', { name: site.name }) }}</p>
      <h1 class="t-display content__title">{{ t('navModes.title') }}</h1>
      <p class="t-body">{{ t('navModes.subtitle') }}</p>

      <ul class="modes">
        <li v-for="mode in NAVIGATION_MODES" :key="mode.route">
          <RouterLink :to="{ name: mode.route, params: { id } }" class="mode">
            <span class="mode__icon"><AppIcon :name="mode.icon" :size="24" /></span>
            <span class="mode__text">
              <span class="mode__title">{{ t(`navModes.${mode.route}.title`) }}</span>
              <span class="mode__description">{{ t(`navModes.${mode.route}.description`) }}</span>
              <BaseBadge tone="success" size="sm">{{ t(`navModes.${mode.route}.tag`) }}</BaseBadge>
            </span>
            <AppIcon name="chevron" :size="20" class="mode__chevron" />
          </RouterLink>
        </li>
      </ul>
    </div>
  </AppPage>
</template>

<style scoped>
.content {
  padding: var(--s-3) var(--gutter) var(--s-8);
}
.content__title {
  margin: 6px 0 var(--s-2);
}
.modes {
  display: grid;
  gap: var(--s-3);
  margin: var(--s-5) 0 0;
  padding: 0;
  list-style: none;
}
.mode {
  display: flex;
  align-items: flex-start;
  gap: var(--s-4);
  padding: 18px;
  border: 1.5px solid var(--sand);
  border-radius: var(--r-lg);
  background: var(--paper);
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
}
.mode:hover {
  border-color: var(--brand-600);
  box-shadow: var(--e-1);
}
.mode__icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  background: var(--brand-50);
  color: var(--brand-600);
}
.mode__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.mode__title {
  font: 700 18px/24px var(--font-heading);
  color: var(--ink-900);
}
.mode__description {
  margin-bottom: 6px;
  font: var(--t-small);
  color: var(--ink-500);
}
.mode__chevron {
  align-self: center;
  color: var(--ink-500);
}
</style>
