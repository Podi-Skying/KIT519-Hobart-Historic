<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="toast-region" role="status" aria-live="polite">
    <Transition name="toast">
      <div v-if="ui.toast" class="toast">
        {{ ui.toast.message }}
        <span v-if="ui.toast.spinner" class="toast__spinner" aria-hidden="true" />
        <!-- Apple: forgiveness — an easy undo beats a confirmation dialog -->
        <button v-if="ui.toast.action" type="button" class="toast__action pressable-dim" @click="ui.runToastAction()">
          {{ ui.toast.action.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-region {
  position: absolute;
  top: calc(var(--chrome-top) + 54px);
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: 12px 18px;
  border-radius: var(--r-pill); /* iOS-style capsule banner */
  background: var(--ink-900);
  color: var(--cream);
  font: var(--t-button);
  box-shadow: var(--e-2);
}
.toast__action {
  min-height: var(--hit);
  margin: calc(-1 * var(--s-3)) calc(-1 * var(--s-2)) calc(-1 * var(--s-3)) 0;
  padding: 0 var(--s-2);
  pointer-events: auto; /* the region ignores the pointer; its button must not */
  font: var(--t-button);
  font-weight: 700;
  color: var(--accent-100); /* 11:1 on the charcoal toast */
}
.toast__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(245, 239, 230, 0.25);
  border-top-color: var(--cream);
  animation: spin 0.8s linear infinite;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(calc(-8px * var(--motion)));
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
