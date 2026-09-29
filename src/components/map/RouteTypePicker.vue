<script setup>
/**
 * Normal / Accessible / Steep choice. Every option shows its real walking time, climb and
 * steepest slope side by side, so the difference is visible at a glance (user feedback: "I can't
 * tell what's different"). The selected one also explains why you'd pick it. While routes are
 * being worked out each option shows a spinner — never a blank that looks broken.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import { ROUTE_TYPES } from '@/data/navigation'

const props = defineProps({
  /** { normal|accessible|steep: {minutes, climbMeters, maxGrade, via, sameAsNormal} } from useWalkingRoute */
  summaries: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  /** Just the three options (navigation screen, where the map shows the rest). */
  compact: { type: Boolean, default: false },
})
const model = defineModel({ type: String, required: true })
const { t } = useI18n()

const ICONS = { normal: 'navigate', accessible: 'accessible', steep: 'mountain' }
const selected = computed(() => props.summaries[model.value])
/** "↑ 12 m · 8%" for one option, or "= Normal" when it's the same route. */
function terrainOf(key) {
  const s = props.summaries[key]
  if (!s || s.climbMeters == null) return ''
  if (s.sameAsNormal) return t('routeTypes.sameShort')
  return `↑${s.climbMeters} m · ${Math.round(s.maxGrade * 100)}%`
}
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
        class="route-type pressable"
        :class="[`route-type--${type.key}`, { 'is-selected': model === type.key }]"
        :aria-checked="model === type.key"
        @click="model = type.key"
      >
        {{ t(`routeTypes.${type.key}.label`) }}
        <!-- While routes load, rough factor estimates would contradict the real times (e.g. Steep
             "faster" than Normal), so show a placeholder; "Checking slopes…" explains it below -->
        <small v-if="loading" class="route-type__loading">
          <span class="spinner" aria-hidden="true" /><span class="sr-only">{{ t('routeTypes.checking') }}</span>
        </small>
        <template v-else>
          <small>{{ t('common.minutes', { n: summaries[type.key].minutes }) }}</small>
          <small v-if="terrainOf(type.key)" class="route-type__terrain">{{ terrainOf(type.key) }}</small>
        </template>
      </button>
    </div>

    <Transition v-if="!compact" name="fade" mode="out-in">
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
  border: 1.5px solid var(--outline);
  border-radius: var(--r-md);
  background: var(--paper);
  color: var(--ink-900);
  font: var(--t-label);
  transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease), scale var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
.route-type small {
  display: block;
  margin-top: 0.125rem;
  font: var(--t-meta);
  font-weight: 500;
  color: var(--ink-500);
}
.route-type__terrain {
  font: var(--t-micro) !important;
  font-weight: 600 !important;
}
.route-type__loading {
  display: flex !important;
  justify-content: center;
  height: 16px;
  align-items: center;
}
.spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--outline);
  border-top-color: var(--brand-600);
  animation: route-spin 0.8s linear infinite;
}
@keyframes route-spin {
  to {
    transform: rotate(360deg);
  }
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
  font: var(--t-body-sm);
  color: var(--ink-700);
}
.route-info__stats {
  margin-top: 0.25rem;
  font: var(--t-label-sm) !important;
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
