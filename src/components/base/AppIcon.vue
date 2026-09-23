<script setup>
import { computed } from 'vue'
import { ICONS } from '@/assets/icons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 22 },
  strokeWidth: { type: [Number, String], default: 2 },
  /** Render as a solid shape (e.g. a liked heart). */
  filled: { type: Boolean, default: false },
})

const markup = computed(() => {
  if (import.meta.env.DEV && !ICONS[props.name]) console.warn(`[AppIcon] unknown icon "${props.name}"`)
  return ICONS[props.name] ?? ''
})
</script>

<template>
  <!-- Icon markup comes from the static, trusted icon registry. -->
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="markup"
  />
</template>

<style scoped>
.icon {
  flex-shrink: 0;
}
</style>
