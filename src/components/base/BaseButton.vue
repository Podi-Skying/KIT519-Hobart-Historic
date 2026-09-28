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
    class="btn pressable"
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
  font: var(--t-button);
  white-space: nowrap;
  /* `scale` = release of the press (base.css › Press feedback); the press itself is instant */
  transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease), scale var(--dur) var(--ease);
}
.btn--md {
  min-height: 48px;
  padding: 0 var(--s-5);
}
.btn--sm {
  border-radius: var(--r-pill); /* small buttons share the capsule shape of the chips and search field beside them */
  min-height: var(--hit);
  padding: 0 var(--s-4);
}
.btn--block {
  width: 100%;
  --press-scale: var(--press-scale-card); /* wide buttons shrink less */
}
.btn--primary {
  background: var(--brand-600);
  color: var(--paper);
}
.btn--primary:active {
  background: var(--brand-700); /* token: pressed */
  transition-duration: 0ms;
}
.btn--secondary {
  background: var(--paper);
  color: var(--ink-900);
  border: 1.5px solid var(--outline);
}
.btn--secondary:active {
  background: var(--parchment);
  transition-duration: 0ms;
}
@media (hover: hover) {
  .btn--primary:hover {
    background: var(--brand-700);
  }
  .btn--secondary:hover {
    border-color: var(--ink-500);
  }
}
.btn--quiet {
  background: var(--sand-fill);
  color: var(--ink-900);
}
</style>
