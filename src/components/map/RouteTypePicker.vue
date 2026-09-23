<script setup>
/** Normal / Accessible / Steep segmented choice with per-type walking time. */
import { ROUTE_TYPES } from '@/data/navigation'
import { walkMinutesFor } from '@/lib/sites'

defineProps({
  site: { type: Object, required: true },
})
const model = defineModel({ type: String, required: true })
</script>

<template>
  <div class="route-types" role="radiogroup" aria-label="Route type">
    <button
      v-for="type in ROUTE_TYPES"
      :key="type.key"
      type="button"
      role="radio"
      class="route-type"
      :class="{ 'is-selected': model === type.key }"
      :aria-checked="model === type.key"
      @click="model = type.key"
    >
      {{ type.label }}
      <small>{{ walkMinutesFor(site, type.key) }} min</small>
    </button>
  </div>
</template>

<style scoped>
.route-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-2);
}
.route-type {
  min-height: 56px;
  padding: var(--s-2) var(--s-1);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  color: var(--ink-900);
  font: 600 13px var(--font-label);
  transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.route-type small {
  display: block;
  margin-top: 2px;
  font: 500 12px var(--font-body);
  color: var(--ink-500);
}
.route-type.is-selected {
  border-color: var(--brand-600);
  background: var(--brand-50);
  color: var(--brand-600);
}
</style>
