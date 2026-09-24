<script setup>
/**
 * Normal / Accessible / Steep choice. Shows each option's real walking time and,
 * for the selected one, why you'd pick it plus its measured climb and steepest slope.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import { ROUTE_TYPES } from '@/data/navigation'

const props = defineProps({
  /** { normal|accessible|steep: {minutes, climbMeters, maxGrade, via, sameAsNormal} } from useWalkingRoute */
  summaries: { type: Object, required: true },
  loading: { type: Boolean, default: false },
})
const model = defineModel({ type: String, required: true })
const { t } = useI18n()

const ICONS = { normal: 'navigate', accessible: 'accessible', steep: 'up' }
const selected = computed(() => props.summaries[model.value])
const stats = computed(() => {
  const s = selected.value
  if (!s || s.climbMeters == null) return []
  return [
    t('routeTypes.climb', { m: s.climbMeters }),
    t('routeTypes.grade', { pct: Math.round(s.maxGrade * 100) }),
    ...(s.via ? [t('routeTypes.via', { place: s.via })] : []),
  ]
})
</script>

<template>
  <div class="route-picker">
    <div class="route-types" role="radiogroup" :aria-label="t('map.routeType')">
      <button
        v-for="type in ROUTE_TYPES"
        :key="type.key"
        type="button"
        role="radio"
        class="route-type"
        :class="[`route-type--${type.key}`, { 'is-selected': model === type.key }]"
        :aria-checked="model === type.key"
        @click="model = type.key"
      >
        {{ t(`routeTypes.${type.key}.label`) }}
        <!-- While routes load, rough factor estimates would contradict the real times (e.g. Steep
             "faster" than Normal), so show a placeholder; "Checking slopes…" explains it below -->
        <small>{{ loading ? '…' : t('common.minutes', { n: summaries[type.key].minutes }) }}</small>
      </button>
    </div>

    <Transition name="fade" mode="out-in">
      <div :key="model" class="route-info" :class="`route-info--${model}`" aria-live="polite">
        <span class="route-info__icon"><AppIcon :name="ICONS[model]" :size="18" /></span>
        <div class="route-info__text">
          <p>{{ t(`routeTypes.${model}.description`) }}</p>
          <p v-if="loading" class="route-info__stats">{{ t('routeTypes.checking') }}</p>
          <p v-else-if="selected?.sameAsNormal" class="route-info__stats">{{ t('routeTypes.sameAsNormal') }}</p>
          <p v-else-if="stats.length" class="route-info__stats">{{ stats.join(' · ') }}</p>
        </div>
      </div>
    </Transition>
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
.route-info {
  display: flex;
  gap: var(--s-3);
  margin-top: var(--s-3);
  padding: var(--s-3);
  border-radius: var(--r-md);
  background: var(--paper);
  border: 1.5px solid var(--sand);
}
.route-info__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-600);
}
.route-info--accessible .route-info__icon {
  background: var(--success-50);
  color: var(--success-600);
}
.route-info--steep .route-info__icon {
  background: var(--accent-50);
  color: var(--accent-700);
}
.route-info__text p {
  font: 400 13px/19px var(--font-body);
  color: var(--ink-700);
}
.route-info__stats {
  margin-top: 4px;
  font: 600 12px var(--font-label) !important;
  color: var(--ink-500) !important;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--dur-fast) var(--ease);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
