<script setup>
import { computed } from 'vue'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { getSiteById } from '@/data/sites'
import { useTripStore } from '@/stores/trip'

const props = defineProps({
  id: { type: Number, required: true },
})

const NOTE_LINES = 3

const trip = useTripStore()
const site = computed(() => getSiteById(props.id))
const print = () => window.print()
</script>

<template>
  <AppPage>
    <PageHeader :fallback="{ name: 'navigate', params: { id } }" />
    <div class="content">
      <p class="t-caption">Paper navigation</p>
      <h1 class="t-display content__title">Printable walking map</h1>
      <p class="t-body">Your route, stops and space for notes. Works offline, needs no battery.</p>

      <article class="paper">
        <svg class="paper__map" viewBox="0 0 300 160" role="img" :aria-label="`Route to ${site.name}`">
          <rect width="300" height="160" fill="var(--map-land)" />
          <path d="M0 50 L300 45 M0 115 L300 108 M120 0 L126 160" stroke="var(--map-road)" stroke-width="9" />
          <path d="M40 140 C80 105 160 85 250 22" stroke="var(--brand-600)" stroke-width="3.5" fill="none" stroke-dasharray="6 5" stroke-linecap="round" />
          <circle cx="40" cy="140" r="7" fill="var(--info-600)" stroke="#fff" stroke-width="2" />
          <circle cx="250" cy="22" r="7" fill="var(--brand-600)" stroke="#fff" stroke-width="2" />
        </svg>
        <ol class="paper__steps">
          <li>Start — your location</li>
          <li v-for="stop in trip.stops" :key="stop.id">{{ stop.label }}</li>
          <li>
            <b>{{ site.name }}</b> · {{ trip.routeTypeConfig.label }} route, {{ trip.minutesTo(site) }} min
          </li>
        </ol>
        <p class="t-caption paper__notes-label">Notes</p>
        <div class="paper__lines" aria-hidden="true"><i v-for="n in NOTE_LINES" :key="n" /></div>
      </article>

      <BaseButton block icon="print" class="no-print content__print" @click="print">Print or save as PDF</BaseButton>
    </div>
  </AppPage>
</template>

<style scoped>
.content {
  padding: var(--s-3) var(--gutter) var(--s-8);
}
.content__title {
  margin: 6px 0 var(--s-2);
}
.paper {
  margin-top: var(--s-5);
  padding: var(--s-4);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-lg);
  background: var(--paper);
}
.paper__map {
  width: 100%;
  border-radius: var(--r-sm);
}
.paper__steps {
  margin-top: var(--s-3);
  padding-left: var(--s-5);
  font: 500 14px/28px var(--font-body);
  color: var(--ink-900);
}
.paper__notes-label {
  margin-top: var(--s-4);
}
.paper__lines i {
  display: block;
  height: 28px;
  border-bottom: 1.5px dashed var(--sand-dark);
}
.content__print {
  margin-top: var(--s-5);
}
</style>
