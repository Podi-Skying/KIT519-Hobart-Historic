<script setup>
/**
 * An AppIcon that cross-fades to the new icon whenever `name` changes.
 * `subtle`: opacity only and short — for always-visible chrome (the tab bar), where a zoom every
 * few seconds would keep pulling the eye (Apple: no attention-grabbing perpetual motion).
 */
import AppIcon from './AppIcon.vue'

defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 22 },
  strokeWidth: { type: [Number, String], default: 2 },
  subtle: { type: Boolean, default: false },
})
</script>

<template>
  <span class="crossfade-icon" :style="{ width: `${size}px`, height: `${size}px` }">
    <Transition :name="subtle ? 'crossfade-subtle' : 'crossfade'">
      <AppIcon :key="name" :name="name" :size="size" :stroke-width="strokeWidth" />
    </Transition>
  </span>
</template>

<style scoped>
.crossfade-icon {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
}
.crossfade-icon > :deep(.icon) {
  position: absolute;
  inset: 0;
}
.crossfade-enter-active,
.crossfade-leave-active {
  transition: opacity var(--dur-crossfade) var(--ease), transform var(--dur-crossfade) var(--ease);
}
.crossfade-enter-from {
  opacity: 0;
  transform: scale(calc(1 - 0.2 * var(--motion)));
}
.crossfade-leave-to {
  opacity: 0;
  transform: scale(calc(1 + 0.1 * var(--motion)));
}
.crossfade-subtle-enter-active,
.crossfade-subtle-leave-active {
  transition: opacity var(--dur) var(--ease);
}
.crossfade-subtle-enter-from,
.crossfade-subtle-leave-to {
  opacity: 0;
}
</style>
