<script setup>
/**
 * "Change navigation mode" — an option on the navigation screens, not a step before them.
 * Walking starts on the standard map (the default); AR and the printable map are one tap away here.
 */
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BottomSheet from '@/components/base/BottomSheet.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { NAVIGATION_MODES } from '@/data/navigation'

const props = defineProps({
  siteId: { type: Number, required: true },
  /** Route name of the mode on screen now. */
  current: { type: String, required: true },
})
const emit = defineEmits(['close'])
const router = useRouter()
const { t } = useI18n()

function choose(route, dismiss) {
  dismiss() // the sheet slides away while the new mode pushes in
  if (route !== props.current) router.push({ name: route, params: { id: props.siteId } })
}
</script>

<template>
  <BottomSheet :label="t('navModes.title')" :title="t('navModes.title')" :subtitle="t('navModes.subtitle')" @close="emit('close')">
    <template #default="{ dismiss }">
      <ul class="modes">
        <li v-for="mode in NAVIGATION_MODES" :key="mode.route">
          <button
            type="button"
            class="mode pressable-card"
            :class="{ 'is-current': mode.route === current }"
            :aria-current="mode.route === current ? 'true' : undefined"
            @click="choose(mode.route, dismiss)"
          >
            <span class="mode__icon"><AppIcon :name="mode.icon" :size="20" /></span>
            <span class="mode__text">
              <span class="mode__title">{{ t(`navModes.${mode.route}.title`) }}</span>
              <span class="mode__description">{{ t(`navModes.${mode.route}.description`) }}</span>
              <BaseBadge tone="success" size="sm">{{ t(`navModes.${mode.route}.tag`) }}</BaseBadge>
            </span>
            <AppIcon :name="mode.route === current ? 'check' : 'chevron'" :size="20" class="mode__end" />
          </button>
        </li>
      </ul>
    </template>
  </BottomSheet>
</template>

<style scoped>
.modes {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.mode {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1.5px solid var(--outline);
  border-radius: var(--r-md);
  background: var(--paper);
  text-align: left;
  transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease), scale var(--dur) var(--ease);
}
.mode.is-current {
  border-color: var(--brand-600);
  background: var(--brand-50);
}
.mode__icon {
  width: var(--row-icon);
  height: var(--row-icon);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md); /* list-row icon tile: same size and shape in every sheet */
  background: var(--sand-fill);
  color: var(--ink-900);
}
.mode.is-current .mode__icon {
  background: var(--paper);
  color: var(--brand-600);
}
.mode__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}
.mode__title {
  font: var(--t-h3);
  font-weight: 600;
  color: var(--ink-900);
}
.mode__description {
  margin-bottom: var(--s-1);
  font: var(--t-meta);
  color: var(--ink-500);
}
.mode__end {
  align-self: center;
  color: var(--ink-500);
}
.mode.is-current .mode__end {
  color: var(--brand-600);
}
</style>
