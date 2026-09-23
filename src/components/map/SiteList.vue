<script setup>
/** Heritage sites, closest first, with live distance and walking time. */
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { formatKm } from '@/lib/format'

const props = defineProps({
  sites: { type: Array, required: true },
  /** Map<siteId, {km, minutes}> from the location store. */
  distances: { type: Map, required: true },
})
const emit = defineEmits(['select'])

const sorted = computed(() => [...props.sites].sort((a, b) => props.distances.get(a.id).km - props.distances.get(b.id).km))
</script>

<template>
  <ul class="site-list">
    <li v-for="site in sorted" :key="site.id">
      <button type="button" class="site-list__row" @click="emit('select', site.id)">
        <span class="site-list__pin">{{ site.id }}</span>
        <span class="site-list__text">
          <b>{{ site.name }}</b>
          <small>{{ site.area }} · {{ distances.get(site.id).minutes }} min walk</small>
        </span>
        <span class="site-list__distance">{{ formatKm(distances.get(site.id).km) }}</span>
        <AppIcon name="chevron" :size="16" class="site-list__chevron" />
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
  gap: var(--s-3);
  padding: var(--s-3) var(--gutter);
  text-align: left;
  transition: background var(--dur-fast);
}
.site-list__row:hover {
  background: var(--parchment);
}
/* Matches the numbered pin on the map */
.site-list__pin {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--ink-900);
  color: var(--cream);
  font: 700 12px var(--font-label);
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
.site-list__chevron {
  color: var(--ink-300);
}
</style>
