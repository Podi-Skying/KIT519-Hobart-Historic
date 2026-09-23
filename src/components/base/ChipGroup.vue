<script setup>
/** Single-choice pill filter (e.g. Home categories). */
defineProps({
  options: { type: Array, required: true }, // [{ key, label }]
  label: { type: String, required: true },
})
const model = defineModel({ type: String, required: true })
</script>

<template>
  <div class="chips" role="radiogroup" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.key"
      type="button"
      role="radio"
      class="chip"
      :class="{ 'is-selected': model === option.key }"
      :aria-checked="model === option.key"
      @click="model = option.key"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  gap: var(--s-2);
  overflow-x: auto;
  scrollbar-width: none;
  margin: 0 calc(var(--gutter) * -1);
  padding: 0 var(--gutter);
}
.chips::-webkit-scrollbar {
  display: none;
}
.chip {
  flex-shrink: 0;
  height: 36px;
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  border: 1.5px solid var(--sand);
  background: var(--paper);
  color: var(--ink-700);
  font: 500 13px var(--font-label);
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.chip:hover {
  border-color: var(--sand-dark);
}
.chip.is-selected {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: var(--paper);
  font-weight: 600;
}
</style>
