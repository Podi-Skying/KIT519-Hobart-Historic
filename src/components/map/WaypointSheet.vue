<script setup>
/**
 * "Add a stop" sheet used during navigation. Toggling a stop updates the trip
 * store, which re-plans the walking route live (heritage sites become waypoints).
 * Header button: ✕ while nothing is selected, a green ✓ once stops are added.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BottomSheet from '@/components/base/BottomSheet.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { MAX_STOPS, WAYPOINTS } from '@/data/navigation'
import { useTripStore } from '@/stores/trip'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  /** Hide the destination itself from the list. */
  destinationId: { type: Number, default: null },
})
const emit = defineEmits(['close'])

const { t } = useI18n()
const trip = useTripStore()
const ui = useUiStore()

const choices = computed(() => WAYPOINTS.filter((w) => w.siteId !== props.destinationId))
const hasSelection = computed(() => trip.stopIds.length > 0)

function toggle(stop) {
  const result = trip.toggleStop(stop.id)
  if (result === 'full') ui.showToast(t('map.toast.stopsFull', { n: MAX_STOPS }))
}
</script>

<template>
  <BottomSheet
    :label="t('stopsSheet.title')"
    :title="t('stopsSheet.title')"
    :subtitle="t('stopsSheet.subtitle', { n: trip.stopIds.length, max: MAX_STOPS })"
    :confirm="hasSelection"
    :close-label="hasSelection ? t('stopsSheet.done', { n: trip.stopIds.length }) : t('common.close')"
    @close="emit('close')"
  >
    <ul class="stops">
      <li v-for="stop in choices" :key="stop.id">
        <button
          type="button"
          class="stop"
          :class="{ 'is-added': trip.hasStop(stop.id) }"
          :aria-pressed="trip.hasStop(stop.id)"
          @click="toggle(stop)"
        >
          <span class="stop__icon"><AppIcon :name="stop.icon" :size="20" /></span>
          <span class="stop__text">
            <b>{{ t(`waypoints.${stop.id}`) }}</b>
            <small>{{ stop.siteId ? t('stopsSheet.heritage') : t('stopsSheet.amenity') }}</small>
          </span>
          <span class="stop__detour">{{ t('stopsSheet.detour', { n: stop.detourMinutes }) }}</span>
          <span class="stop__check" aria-hidden="true">
            <AppIcon v-if="trip.hasStop(stop.id)" name="check" :size="16" :stroke-width="3" />
          </span>
        </button>
      </li>
    </ul>
  </BottomSheet>
</template>

<style scoped>
.stops {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.stop {
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  text-align: left;
  transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
}
.stop:hover {
  border-color: var(--sand-dark);
}
.stop.is-added {
  border-color: var(--brand-600);
  background: var(--brand-50);
}
.stop__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--cream);
  color: var(--ink-900);
}
.stop.is-added .stop__icon {
  background: var(--paper);
  color: var(--brand-600);
}
.stop__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.stop__text b {
  font: 600 15px/20px var(--font-label);
  color: var(--ink-900);
}
.stop__text small {
  font: 400 12px var(--font-body);
  color: var(--ink-500);
}
.stop__detour {
  font: 600 12px var(--font-label);
  color: var(--ink-500);
  white-space: nowrap;
}
.stop__check {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--sand-dark);
  color: var(--paper);
}
.stop.is-added .stop__check {
  border-color: var(--brand-600);
  background: var(--brand-600);
}
</style>
