<script setup>
/** Paper copy of the route: Google map + real turn-by-turn steps + space for notes. */
import { computed, onMounted } from 'vue'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import SiteMap from '@/components/map/SiteMap.vue'
import { getSiteById } from '@/data/sites'
import { formatMeters } from '@/lib/format'
import { maneuverIcon } from '@/lib/guidance'
import { useWalkingRoute } from '@/composables/useWalkingRoute'
import { useTripStore } from '@/stores/trip'
import { useLocationStore } from '@/stores/location'

const props = defineProps({
  id: { type: Number, required: true },
})

const NOTE_LINES = 3

const trip = useTripStore()
const location = useLocationStore()
const site = computed(() => getSiteById(props.id))
const walk = useWalkingRoute(site)
const user = computed(() => (location.isInHobart ? location.coords : null))
const amenityStops = computed(() => trip.stops.filter((s) => !s.siteId))

onMounted(() => location.start())
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
        <div class="paper__map">
          <SiteMap
            :sites="[site, ...walk.stopSites.value]"
            :selected-id="site.id"
            :route-path="walk.path.value"
            :route-type="trip.routeTypeConfig"
            :real-route="walk.isRealRoute.value"
            :user="user"
            :start="location.origin"
            fit="route"
            :interactive="false"
            :padding="{ top: 32, right: 32, bottom: 32, left: 32 }"
            :box="{ x: [12, 88], y: [14, 86] }"
          />
        </div>

        <p class="paper__summary">
          <b>{{ site.name }}</b> · {{ trip.routeTypeConfig.label }} route · {{ walk.minutes.value }} min ·
          {{ formatMeters(walk.distanceMeters.value) }} {{ location.originLabel }}
        </p>

        <ol v-if="walk.isRealRoute.value" class="paper__steps">
          <li v-for="(step, i) in walk.route.value.steps" :key="i">
            <AppIcon :name="maneuverIcon(step.maneuver)" :size="16" />
            <span>{{ step.instruction }}</span>
            <small>{{ formatMeters(step.distanceMeters) }}</small>
          </li>
          <li>
            <AppIcon name="pin" :size="16" />
            <span>Arrive at {{ site.name }}</span>
          </li>
        </ol>
        <ol v-else class="paper__steps paper__steps--simple">
          <li><span>Start — {{ user ? 'your location' : 'Franklin Square (city centre)' }}</span></li>
          <li v-for="stop in walk.stopSites.value" :key="stop.id"><span>{{ stop.name }}</span></li>
          <li><span><b>{{ site.name }}</b></span></li>
        </ol>

        <p v-if="amenityStops.length" class="paper__reminders">
          Also on your list: {{ amenityStops.map((s) => s.label).join(', ') }}
        </p>

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
  position: relative;
  height: 220px;
  overflow: hidden;
  border-radius: var(--r-sm);
}
.paper__summary {
  margin-top: var(--s-3);
  font: var(--t-small);
  color: var(--ink-700);
}
.paper__summary b {
  color: var(--ink-900);
}
.paper__steps {
  margin: var(--s-3) 0 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}
.paper__steps li {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  align-items: start;
  gap: var(--s-2);
  padding: 7px 0;
  border-bottom: 1px dashed var(--sand);
  font: 500 13px/18px var(--font-body);
  color: var(--ink-900);
}
.paper__steps li :deep(svg) {
  margin-top: 1px;
  color: var(--ink-500);
}
.paper__steps small {
  font: 600 12px var(--font-label);
  color: var(--ink-500);
  white-space: nowrap;
}
.paper__steps--simple li {
  grid-template-columns: 1fr;
}
.paper__reminders {
  margin-top: var(--s-3);
  font: var(--t-small);
  color: var(--ink-500);
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
