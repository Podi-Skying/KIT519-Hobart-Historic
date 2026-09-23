<script setup>
/** Nearby heritage sites, closest first. */
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { formatKm } from '@/lib/format'

const props = defineProps({
  sites: { type: Array, required: true },
})
const emit = defineEmits(['select'])

const sorted = computed(() => [...props.sites].sort((a, b) => a.distanceKm - b.distanceKm))
</script>

<template>
  <ul class="site-list">
    <li v-for="site in sorted" :key="site.id">
      <button type="button" class="site-list__row" @click="emit('select', site.id)">
        <AppIcon name="pin" class="site-list__icon" />
        <span class="site-list__text">
          <b>{{ site.name }}</b>
          <small>{{ site.area }} · {{ site.walkMinutes }} min walk</small>
        </span>
        <span class="site-list__distance">{{ formatKm(site.distanceKm) }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.site-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.site-list__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-3) var(--gutter);
  text-align: left;
  transition: background var(--dur-fast);
}
.site-list__row:hover {
  background: var(--parchment);
}
.site-list__icon {
  color: var(--ink-500);
}
.site-list__text {
  flex: 1;
  min-width: 0;
}
.site-list__text b {
  display: block;
  font: 600 15px/20px var(--font-heading);
  color: var(--ink-900);
}
.site-list__text small {
  font: var(--t-small);
  color: var(--ink-500);
}
.site-list__distance {
  font: 600 13px var(--font-label);
  color: var(--ink-700);
}
</style>
