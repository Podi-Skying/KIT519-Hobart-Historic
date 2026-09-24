<script setup>
/** An AppIcon that cross-fades to the new icon whenever `name` changes. */
import AppIcon from './AppIcon.vue'

defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 22 },
  strokeWidth: { type: [Number, String], default: 2 },
})
</script>

<template>
  <span class="crossfade-icon" :style="{ width: `${size}px`, height: `${size}px` }">
    <Transition name="crossfade">
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
  transition: opacity 0.9s var(--ease), transform 0.9s var(--ease);
}
.crossfade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.crossfade-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>
