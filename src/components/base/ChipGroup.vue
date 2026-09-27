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
      class="chip pressable"
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
  min-width: 0; /* never let long chip rows widen a grid/flex parent past the screen */
  display: flex;
  gap: var(--s-2);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-padding: 0 var(--gutter);
  scrollbar-width: none;
  margin: 0 calc(var(--gutter) * -1);
  padding: 4px var(--gutter); /* room for the chips' 44px touch area */
  /* fade the right edge to hint that the row scrolls */
  mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
}
.chips::after {
  content: '';
  flex: 0 0 12px; /* trailing space so the last chip can scroll clear of the fade */
}
.chips::-webkit-scrollbar {
  display: none;
}
.chip {
  position: relative;
  flex-shrink: 0;
  height: 36px;
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  border: 1.5px solid var(--outline); /* ≥ 3:1 so the chip reads as a control (WCAG 1.4.11) */
  background: var(--paper);
  color: var(--ink-700);
  font: var(--t-label);
  font-weight: 500;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease),
    scale var(--dur) var(--ease);
}
@media (hover: hover) {
  .chip:hover {
    border-color: var(--ink-500);
  }
}
.chip::before {
  content: '';
  position: absolute;
  inset: -5px 0; /* 36px visual, 46px touch height */
}
.chip.is-selected {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: var(--paper);
  font-weight: 600;
}
</style>
