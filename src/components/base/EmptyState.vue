<script setup>
defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <p class="empty__title">{{ title }}</p>
    <p v-if="message" class="empty__message">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-8) var(--gutter);
  text-align: center;
}
.empty__title {
  font: var(--t-h2);
  color: var(--ink-900);
}
.empty__message {
  font: var(--t-small);
  color: var(--ink-500);
  margin-bottom: var(--s-2);
}
</style>
