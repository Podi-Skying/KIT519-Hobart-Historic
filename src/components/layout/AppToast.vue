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
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-region {
  position: absolute;
  top: 104px;
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
  border-radius: var(--r-md);
  background: var(--ink-900);
  color: var(--cream);
  font: 600 14px var(--font-label);
  box-shadow: var(--e-2);
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
  transform: translateY(-8px);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
