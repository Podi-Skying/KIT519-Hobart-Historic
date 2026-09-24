<script setup>
/**
 * "You've arrived" — shared by standard and AR navigation. Opens on its own when the walker
 * reaches the destination (or on "Simulate arrival"), then offers the site's content.
 * Narration is one tap away rather than autoplaying: sound that starts by itself is hard to
 * stop for screen-reader users (WCAG 1.4.2) and startling in the street.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BottomSheet from '@/components/base/BottomSheet.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const props = defineProps({
  /** Content-localised site (from useContent). */
  site: { type: Object, required: true },
  /** The main next step: 'audio' after the map, 'ar' when the camera is already up. */
  primary: { type: String, default: 'audio', validator: (v) => ['audio', 'ar'].includes(v) },
})
const emit = defineEmits(['close'])
const { t } = useI18n()

/** Listen and Scan, with the primary one on top. */
const actions = computed(() => {
  const audio = { key: 'audio', icon: 'headphones', label: 'arNav.listen', to: { name: 'audio', params: { id: props.site.id } } }
  const ar = { key: 'ar', icon: 'ar', label: 'arNav.scan', to: { name: 'ar', params: { id: props.site.id } } }
  return props.primary === 'ar' ? [ar, audio] : [audio, ar]
})
</script>

<template>
  <BottomSheet :label="t('arNav.arrived')" @close="emit('close')">
    <div class="arrived">
      <span class="arrived__icon"><AppIcon name="check" :size="28" :stroke-width="2.6" /></span>
      <h2 class="t-h1">{{ t('arNav.arrived') }}</h2>
      <p class="t-body">{{ t('arNav.inFront', { name: site.name }) }}</p>
      <BaseButton
        v-for="action in actions"
        :key="action.key"
        block
        :icon="action.icon"
        :variant="action.key === primary ? 'primary' : 'secondary'"
        :to="action.to"
      >
        {{ t(action.label) }}
      </BaseButton>
      <BaseButton block variant="quiet" :to="{ name: 'site', params: { id: site.id } }">{{ t('arNav.viewDetails') }}</BaseButton>
    </div>
  </BottomSheet>
</template>

<style scoped>
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
</style>
