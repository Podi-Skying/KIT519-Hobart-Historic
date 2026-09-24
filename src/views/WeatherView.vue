<script setup>
/**
 * Walking conditions. Numbers come from data/weather.js; all wording is localised.
 * "Now" follows the simulated live weather (stores/weather.js), like the tab icon.
 * The advice card leads straight into planning (Accessible route preselected), so the
 * page isn't a dead end.
 */
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import CrossfadeIcon from '@/components/base/CrossfadeIcon.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import { computed } from 'vue'
import { BEST_COMFORT_SCORE, CONDITIONS, WEATHER } from '@/data/weather'
import { useTripStore } from '@/stores/trip'
import { useWeatherStore } from '@/stores/weather'

const { bestWindow, hourlyComfort } = WEATHER
const { t } = useI18n()
const router = useRouter()
const trip = useTripStore()
const weather = useWeatherStore()

const current = computed(() => weather.current)
const summary = computed(() => t('weather.now', { summary: t(`weather.conditions.${current.value.condition}`) }))
const stats = computed(() => [
  { icon: 'wind', value: `${current.value.wind} km/h` },
  { icon: 'drop', value: `${current.value.rain}%` },
  { icon: 'sun', value: t('weather.uvLow') },
])
/** Today's forecast tile follows the live reading. */
const forecast = computed(() => [
  { ...WEATHER.forecast[0], condition: current.value.condition, high: current.value.temperature },
  ...WEATHER.forecast.slice(1),
])

/** The route picker shows "Accessible" already selected as soon as a place is chosen. */
function planAccessibleWalk() {
  trip.setRouteType('accessible')
  router.push({ name: 'map' })
}
</script>

<template>
  <AppPage>
    <header class="header">
      <p class="t-caption">{{ t('weather.eyebrow', { place: WEATHER.location }) }}</p>
      <h1 class="t-h1">{{ t('weather.title') }}</h1>
    </header>

    <section class="now" :aria-label="summary">
      <CrossfadeIcon class="now__icon" :name="CONDITIONS[current.condition].icon" :size="56" :stroke-width="1.6" />
      <p class="now__summary">{{ summary }}</p>
      <p class="now__temp">{{ current.temperature }}°</p>
      <p class="now__verdict">{{ t('weather.verdict', { verdict: t(`weather.verdicts.${current.verdict}`), n: current.feelsLike }) }}</p>
    </section>

    <ul class="stats">
      <li v-for="stat in stats" :key="stat.icon" class="stat">
        <AppIcon :name="stat.icon" :size="18" />
        <b>{{ stat.value }}</b>
        {{ t(`weather.stats.${stat.icon}`) }}
      </li>
    </ul>

    <SectionHeader :title="t('weather.bestTime')">
      <template #action><BaseBadge tone="success" size="sm">{{ bestWindow }}</BaseBadge></template>
    </SectionHeader>
    <figure class="comfort">
      <figcaption class="t-small muted">{{ t('weather.comfort') }}</figcaption>
      <!-- Bars are visual only; screen readers get the same numbers as a list -->
      <ol class="sr-only">
        <li v-for="h in hourlyComfort" :key="h.hour">{{ t('weather.hourScore', { hour: h.hour, score: h.score }) }}</li>
      </ol>
      <div class="comfort__bars" aria-hidden="true">
        <div
          v-for="h in hourlyComfort"
          :key="h.hour"
          class="comfort__bar"
          :class="{ 'is-best': h.score >= BEST_COMFORT_SCORE }"
          :style="{ height: `${h.score}%` }"
          :title="`${h.hour}:00 — ${h.score}/100`"
        />
      </div>
      <div class="comfort__labels" aria-hidden="true">
        <span v-for="h in hourlyComfort" :key="h.hour">{{ h.hour }}</span>
      </div>
    </figure>

    <SectionHeader :title="t('weather.week')" />
    <!-- Scrolls sideways, so it takes keyboard focus (WCAG 2.1.1) -->
    <ul class="forecast" tabindex="0" :aria-label="t('weather.week')">
      <li v-for="(day, i) in forecast" :key="day.day" :class="{ 'is-today': i === 0 }">
        {{ t(`weather.days.${day.day.toLowerCase()}`) }}
        <span class="forecast__icon" aria-hidden="true">{{ CONDITIONS[day.condition].emoji }}</span>
        <span class="sr-only">{{ t(`weather.conditions.${day.condition}`) }}</span>
        <b>{{ day.high }}°</b>
      </li>
    </ul>

    <div class="advice">
      <p class="advice__text">
        <AppIcon name="shoe" :size="22" />
        <span>{{ t('weather.advice') }}</span>
      </p>
      <BaseButton block icon="accessible" @click="planAccessibleWalk">{{ t('weather.planAccessible') }}</BaseButton>
    </div>
  </AppPage>
</template>

<style scoped>
.header {
  padding: var(--s-2) var(--gutter) var(--s-2);
}
.header h1 {
  margin-top: 4px;
}
.now {
  position: relative;
  margin: var(--s-2) var(--gutter) 0;
  padding: 22px;
  overflow: hidden;
  border-radius: var(--r-xl);
  background: linear-gradient(160deg, #3b3326 0%, #6b3a3f 55%, #c77b45 100%);
  color: var(--cream);
}
.now::after {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(246, 223, 196, 0.5), transparent 70%);
}
.now__icon {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
  color: var(--cream);
}
.now__summary {
  font: var(--t-small);
  opacity: 0.9;
}
.now__temp {
  margin: 8px 0 4px;
  font: 700 58px/1 var(--font-heading);
}
.now__verdict {
  font: 600 14px var(--font-label);
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: var(--s-4) var(--gutter) 0;
  padding: 0;
  list-style: none;
}
.stat {
  padding: var(--s-3);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  font: 500 12px var(--font-label);
  color: var(--ink-500);
}
.stat b {
  display: block;
  margin: 4px 0 1px;
  font: 700 17px var(--font-label);
  color: var(--ink-900);
}
.comfort {
  margin: 0 var(--gutter);
  padding: var(--s-4);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-lg);
  background: var(--paper);
}
.comfort__bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 80px;
  margin-top: var(--s-3);
}
.comfort__bar {
  flex: 1;
  border-radius: 6px 6px 2px 2px;
  background: var(--sand);
}
.comfort__bar.is-best {
  background: var(--success-600);
}
.comfort__labels {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.comfort__labels span {
  flex: 1;
  text-align: center;
  font: 600 10px var(--font-label);
  color: var(--ink-500);
}
.forecast {
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 0 var(--gutter);
  overflow-x: auto;
  list-style: none;
  scrollbar-width: none;
}
.forecast li {
  flex: 0 0 64px;
  padding: var(--s-3) var(--s-1);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  text-align: center;
  font: 600 12px var(--font-label);
  color: var(--ink-500);
}
.forecast li.is-today {
  border-color: var(--brand-600);
  background: var(--brand-50);
  color: var(--brand-600);
}
.forecast__icon {
  display: block;
  margin-top: 6px;
  font-size: 20px;
}
.forecast b {
  display: block;
  margin-top: 6px;
  font: 700 15px var(--font-label);
  color: var(--ink-900);
}
.advice {
  margin: var(--s-5) var(--gutter) var(--s-6);
  padding: var(--s-4);
  border-radius: var(--r-md);
  background: var(--success-50);
  color: var(--ink-900);
  font: 500 14px/21px var(--font-body);
}
.advice__text {
  display: flex;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
}
.advice__text :deep(svg) {
  margin-top: 2px;
  color: var(--success-600);
}
</style>
