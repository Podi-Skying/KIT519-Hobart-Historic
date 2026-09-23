<script setup>
/** Dark instruction / status capsule shown over camera views. */
import AppIcon from '@/components/base/AppIcon.vue'

defineProps({
  icon: { type: String, default: '' },
  /** success = green check badge before the text */
  tone: { type: String, default: 'default', validator: (v) => ['default', 'success'].includes(v) },
  spinner: { type: Boolean, default: false },
})
</script>

<template>
  <p class="pill" role="status" aria-live="polite">
    <span v-if="tone === 'success'" class="pill__check"><AppIcon name="check" :size="14" :stroke-width="3" /></span>
    <AppIcon v-else-if="icon" :name="icon" :size="20" :stroke-width="2.6" />
    <slot />
    <span v-if="spinner" class="pill__spinner" aria-hidden="true" />
  </p>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: var(--r-md);
  background: var(--ink-900);
  color: var(--cream);
  font: 600 15px var(--font-label);
  white-space: nowrap;
  box-shadow: var(--e-2);
}
.pill__check {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--success-600);
}
.pill__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(245, 239, 230, 0.25);
  border-top-color: var(--cream);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
