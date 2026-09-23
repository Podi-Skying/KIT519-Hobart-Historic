<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  /** brand = selected/featured · success = accessible/good · accent = highlight · neutral = facts · paper = on photos */
  tone: { type: String, default: 'neutral', validator: (v) => ['brand', 'success', 'accent', 'neutral', 'paper', 'solid'].includes(v) },
  icon: { type: String, default: '' },
  iconFilled: { type: Boolean, default: false },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md'].includes(v) },
})
</script>

<template>
  <span class="badge" :class="[`badge--${tone}`, `badge--${size}`]">
    <AppIcon v-if="icon" :name="icon" :size="size === 'sm' ? 12 : 15" :filled="iconFilled" :stroke-width="2.4" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--r-pill);
  font: 600 12px/1 var(--font-label);
  white-space: nowrap;
}
.badge--md {
  height: 30px;
  padding: 0 12px;
}
.badge--sm {
  height: 24px;
  padding: 0 9px;
  font-size: 11px;
}
.badge--neutral {
  background: var(--paper);
  color: var(--ink-900);
  border: 1.5px solid var(--sand);
}
.badge--brand {
  background: var(--brand-50);
  color: var(--brand-600);
}
.badge--solid {
  background: var(--brand-600);
  color: var(--paper);
}
.badge--success {
  background: var(--success-50);
  color: var(--success-600);
}
.badge--accent {
  background: var(--accent-50);
  color: var(--accent-700);
}
.badge--paper {
  background: rgba(255, 255, 255, 0.94);
  color: var(--ink-900);
  box-shadow: var(--e-1);
}
</style>
