<script setup>
defineProps({
  title: { type: String, required: true },
  /** Small supporting text on the right, e.g. "5 sites". Use the #action slot for controls. */
  meta: { type: String, default: '' },
  as: { type: String, default: 'h2' },
})
</script>

<template>
  <div class="section-header">
    <component :is="as" class="section-header__title">{{ title }}</component>
    <slot name="action">
      <span v-if="meta" class="section-header__meta">{{ meta }}</span>
    </slot>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-6) var(--gutter) var(--s-3);
}
.section-header__title {
  font: var(--t-h2);
  color: var(--ink-900);
}
.section-header__meta {
  font: var(--t-small);
  color: var(--ink-500);
}
</style>
