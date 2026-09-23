<script setup>
/** "Then vs now": blend the archival reconstruction over today's view. */
import { computed, ref } from 'vue'
import IconButton from '@/components/base/IconButton.vue'
import { AR_DEMO_SITE_ID, getSiteById } from '@/data/sites'
import { useGoBack } from '@/composables/useGoBack'

const PRESENT = 100
const PAST = 0

const site = getSiteById(AR_DEMO_SITE_ID)
const { pastYear, pastImage, presentImage, pastCaption, presentCaption } = site.timeTravel

/** 0 = fully past, 100 = fully present */
const blend = ref(PRESENT)
const showingPast = computed(() => blend.value < 50)
const goBack = useGoBack({ name: 'ar' })
</script>

<template>
  <div class="compare">
    <img class="compare__layer" :src="presentImage" :alt="`${site.name} today`" />
    <img
      class="compare__layer"
      :src="pastImage"
      :alt="`${site.name} in ${pastYear}`"
      :style="{ opacity: (100 - blend) / 100 }"
    />
    <div class="compare__veil" />

    <IconButton class="compare__back" variant="glass" icon="back" label="Back" @click="goBack" />

    <div class="segmented" role="radiogroup" aria-label="Period">
      <button type="button" role="radio" :aria-checked="showingPast" :class="{ 'is-on': showingPast }" @click="blend = PAST">
        {{ pastYear }}
      </button>
      <button type="button" role="radio" :aria-checked="!showingPast" :class="{ 'is-on': !showingPast }" @click="blend = PRESENT">
        Today
      </button>
    </div>

    <section class="caption-card">
      <p class="t-caption">{{ showingPast ? pastYear : 'Today' }}</p>
      <p class="caption-card__text" aria-live="polite">{{ showingPast ? pastCaption : presentCaption }}</p>
      <input v-model.number="blend" class="caption-card__slider" type="range" min="0" max="100" :aria-label="`Blend between ${pastYear} and today`" />
      <div class="caption-card__ends">
        <span>{{ pastYear }}</span><span>Today</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.compare {
  position: relative;
  overflow: hidden;
  background: #000;
}
.compare__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.compare__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 26%);
  pointer-events: none;
}
.compare__back {
  position: absolute;
  top: 50px;
  left: var(--gutter);
  z-index: 3;
}
.segmented {
  position: absolute;
  top: 50px;
  left: 50%;
  z-index: 3;
  display: flex;
  padding: 4px;
  border-radius: var(--r-pill);
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform: translateX(-50%);
}
.segmented button {
  height: 36px;
  padding: 0 18px;
  border-radius: var(--r-pill);
  color: var(--cream);
  font: 600 13px var(--font-label);
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.segmented button.is-on {
  background: var(--cream);
  color: var(--ink-900);
}
.caption-card {
  position: absolute;
  left: var(--gutter);
  right: var(--gutter);
  bottom: 18px;
  z-index: 3;
  padding: var(--s-4);
  border-radius: var(--r-lg);
  background: var(--cream);
  box-shadow: var(--e-2);
}
.caption-card__text {
  margin-top: 4px;
  font: 400 14px/21px var(--font-body);
  color: var(--ink-900);
}
.caption-card__slider {
  width: 100%;
  margin: var(--s-3) 0 var(--s-1);
  accent-color: var(--brand-600);
}
.caption-card__ends {
  display: flex;
  justify-content: space-between;
  font: 600 12px var(--font-label);
  color: var(--ink-900);
}
</style>
