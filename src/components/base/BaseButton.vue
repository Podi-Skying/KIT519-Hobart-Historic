<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  /** primary = the one main action per screen · secondary = everything else · quiet = low emphasis */
  variant: { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'quiet'].includes(v) },
  size: { type: String, default: 'md', validator: (v) => ['md', 'sm'].includes(v) },
  icon: { type: String, default: '' },
  block: { type: Boolean, default: false },
  /** Router location — renders a link instead of a button. */
  to: { type: [String, Object], default: null },
})

const tag = computed(() => (props.to ? RouterLink : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to ?? undefined"
    :type="to ? undefined : 'button'"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block }]"
  >
    <AppIcon v-if="icon" :name="icon" :size="size === 'sm' ? 16 : 18" />
    <slot />
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  border-radius: var(--r-md);
  font: 600 14px/1 var(--font-label);
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease), transform var(--dur-fast);
}
.btn:active {
  transform: scale(0.98);
}
.btn--md {
  min-height: 48px;
  padding: 0 var(--s-5);
}
.btn--sm {
  min-height: 40px;
  padding: 0 var(--s-4);
  font-size: 13px;
}
.btn--block {
  width: 100%;
}
.btn--primary {
  background: var(--brand-600);
  color: var(--paper);
}
.btn--primary:hover {
  background: var(--brand-700);
}
.btn--secondary {
  background: var(--paper);
  color: var(--ink-900);
  border: 1.5px solid var(--sand);
}
.btn--secondary:hover {
  border-color: var(--sand-dark);
}
.btn--quiet {
  background: var(--sand-fill);
  color: var(--ink-900);
}
</style>
