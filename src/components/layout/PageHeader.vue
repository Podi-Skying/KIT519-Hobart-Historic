<script setup>
/** Sub-page header: back button, optional eyebrow + title, trailing slot. */
import IconButton from '@/components/base/IconButton.vue'
import { useGoBack } from '@/composables/useGoBack'

const props = defineProps({
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  /** Where "back" goes when there is no history (deep link). */
  fallback: { type: [String, Object], default: () => ({ name: 'home' }) },
  showBack: { type: Boolean, default: true },
})

const goBack = useGoBack(props.fallback)
</script>

<template>
  <header class="page-header">
    <IconButton v-if="showBack" class="no-print" icon="back" label="Back" variant="sand" @click="goBack" />
    <div class="page-header__text">
      <p v-if="eyebrow" class="t-caption">{{ eyebrow }}</p>
      <h1 v-if="title" class="page-header__title">{{ title }}</h1>
    </div>
    <slot />
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--gutter) var(--s-2);
}
.page-header__text {
  flex: 1;
  min-width: 0;
}
.page-header__title {
  font: var(--t-h3);
  color: var(--ink-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
