<script setup>
/**
 * "Finding walking routes…" over the map while Google Routes + terrain are being worked out.
 * Status feedback (Apple: expose ongoing status) — without it a blank map reads as broken.
 */
defineProps({
  show: { type: Boolean, default: false },
  label: { type: String, required: true },
})
</script>

<template>
  <div class="map-loading-region" role="status" aria-live="polite">
    <Transition name="map-loading">
      <p v-if="show" class="map-loading">
        <span class="map-loading__spinner" aria-hidden="true" />
        {{ label }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.map-loading-region {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.map-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-4);
  border-radius: var(--r-pill);
  background: var(--glass);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  color: var(--cream);
  font: var(--t-button);
  box-shadow: var(--e-2);
}
.map-loading__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(245, 239, 230, 0.3);
  border-top-color: var(--cream);
  animation: map-spin 0.8s linear infinite;
}
@keyframes map-spin {
  to {
    transform: rotate(360deg);
  }
}
/* materializes rather than popping in */
.map-loading-enter-active,
.map-loading-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease), filter var(--dur) var(--ease);
}
.map-loading-enter-from,
.map-loading-leave-to {
  opacity: 0;
  transform: translateY(calc(-6px * var(--motion))) scale(calc(1 - 0.06 * var(--motion)));
  filter: blur(calc(4px * var(--motion)));
}
</style>
