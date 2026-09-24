<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  icon: { type: String, required: true },
  /** Accessible name — required because the button has no visible text. */
  label: { type: String, required: true },
  /**
   * paper  white circle on photos/cream
   * sand   quiet circle inside cream headers
   * glass  translucent charcoal over camera views
   * float  white rounded square floating on maps
   * success  green confirm button (e.g. "Done" once something is selected)
   */
  variant: { type: String, default: 'paper', validator: (v) => ['paper', 'sand', 'glass', 'float', 'success'].includes(v) },
  iconSize: { type: [Number, String], default: 20 },
  /** Toggle state (sets aria-pressed + active styling). Leave null for plain buttons. */
  pressed: { type: Boolean, default: null },
  /** Visual "on" state without aria-pressed (e.g. search open). */
  active: { type: Boolean, default: false },
  filled: { type: Boolean, default: false },
})
</script>

<template>
  <button
    type="button"
    class="icon-btn"
    :class="[`icon-btn--${variant}`, { 'is-active': active || pressed }]"
    :aria-label="label"
    :aria-pressed="pressed ?? undefined"
  >
    <AppIcon :name="icon" :size="iconSize" :filled="filled" :stroke-width="2.2" />
  </button>
</template>

<style scoped>
.icon-btn {
  width: var(--hit);
  height: var(--hit);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: var(--ink-900);
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.icon-btn--paper {
  background: var(--paper);
  box-shadow: var(--e-1);
}
.icon-btn--sand {
  background: var(--sand-fill);
}
.icon-btn--glass {
  background: var(--glass);
  color: var(--cream);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.icon-btn--float {
  border-radius: var(--r-md);
  background: var(--paper);
  box-shadow: var(--e-2);
}
.icon-btn--success {
  background: var(--success-600);
  color: var(--paper);
  box-shadow: 0 4px 12px rgba(74, 103, 65, 0.35);
}
.icon-btn.is-active {
  background: var(--ink-900);
  color: var(--cream);
}
</style>
