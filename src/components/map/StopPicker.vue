<script setup>
/** Row of round quick-add buttons for optional stops (toilets, coffee…). */
import AppIcon from '@/components/base/AppIcon.vue'
import { WAYPOINTS } from '@/data/navigation'

defineProps({
  selectedIds: { type: Array, required: true },
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <div class="stops" role="group" aria-label="Add a stop">
    <button
      v-for="stop in WAYPOINTS"
      :key="stop.id"
      type="button"
      class="stop"
      :class="{ 'is-added': selectedIds.includes(stop.id) }"
      :aria-pressed="selectedIds.includes(stop.id)"
      @click="emit('toggle', stop)"
    >
      <span class="stop__icon">
        <AppIcon :name="selectedIds.includes(stop.id) ? 'check' : stop.icon" :size="22" />
      </span>
      {{ stop.label }}
    </button>
  </div>
</template>

<style scoped>
.stops {
  display: flex;
  gap: var(--s-3);
  padding: var(--s-1) var(--gutter) var(--s-2);
  overflow-x: auto;
  scrollbar-width: none;
}
.stops::-webkit-scrollbar {
  display: none;
}
.stop {
  flex: 0 0 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-2);
  text-align: center;
  font: 600 12px/15px var(--font-label);
  color: var(--ink-700);
}
.stop__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--sand);
  background: var(--paper);
  color: var(--ink-900);
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.stop.is-added .stop__icon {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: var(--paper);
}
</style>
