<script setup>
/**
 * Leading page — shown on every launch and refresh (the router then always continues to Home).
 * Step 1: any tap / Enter / Space. Step 2: the language list grows out of the Tap-to-start
 * circle (anchored to where you tapped); choosing a language enters Home in that language.
 */
import { nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TapToStart from './TapToStart.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import splashImage from '@/assets/images/splash-bg.jpg'
import { LOCALES, setLocale } from '@/i18n'
import { haptic } from '@/services/haptics'

const emit = defineEmits(['start'])
const { t, locale } = useI18n()
const root = ref(null)
const list = ref(null)
/** 'tap' → 'language' */
const step = ref('tap')

onMounted(() => root.value?.focus({ preventScroll: true }))

async function start() {
  if (step.value !== 'tap') return
  step.value = 'language'
  await nextTick()
  // keyboard / screen-reader users land on the current language
  list.value?.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true })
}

function choose(code) {
  setLocale(code)
  haptic('selection')
  emit('start')
}
</script>

<template>
  <div
    ref="root"
    class="splash"
    :class="{ 'is-choosing': step === 'language' }"
    :role="step === 'tap' ? 'button' : undefined"
    :tabindex="step === 'tap' ? 0 : -1"
    :aria-label="step === 'tap' ? t('splash.aria') : undefined"
    @click="start"
    @keydown.enter.self.prevent="start"
    @keydown.space.self.prevent="start"
  >
    <img class="splash__photo" :src="splashImage" alt="" fetchpriority="high" />
    <div class="splash__veil" />

    <p class="splash__location rise">{{ t('splash.location') }}</p>

    <p class="splash__script rise-tilted" aria-hidden="true">
      {{ t('splash.script1') }}<span>{{ t('splash.script2') }}</span>
      <svg width="96" height="10" viewBox="0 0 96 10">
        <path d="M2 8C30 2 62 1 94 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </p>

    <div class="splash__copy">
      <p class="splash__eyebrow rise d1">{{ t('splash.eyebrow') }}</p>
      <h1 class="splash__title rise d2">
        <span class="splash__title-main">{{ t('splash.titleMain') }}</span>
        <span class="splash__title-sub">{{ t('splash.titleSub') }}</span>
      </h1>
      <span class="splash__rule rise d3" />
    </div>

    <div class="splash__cta">
      <!-- Both steps share one grid cell and cross over at once (no out-in wait) -->
      <Transition name="cta">
        <TapToStart v-if="step === 'tap'" key="tap" class="splash__tap rise d4" :label="t('splash.tap')" />
        <section
          v-else
          key="language"
          class="lang-card"
          role="dialog"
          aria-labelledby="splash-lang-title"
          @click.stop
        >
          <h2 id="splash-lang-title" class="lang-card__title">{{ t('splash.chooseLanguage') }}</h2>
          <div ref="list" class="lang-card__list" role="radiogroup" aria-labelledby="splash-lang-title">
            <button
              v-for="option in LOCALES"
              :key="option.code"
              type="button"
              role="radio"
              class="lang-card__option pressable-card"
              :class="{ 'is-current': locale === option.code }"
              :aria-checked="locale === option.code"
              :lang="option.code"
              @click="choose(option.code)"
            >
              <span class="lang-card__text">
                <b>{{ option.label }}</b>
                <small lang="en">{{ option.english }}</small>
              </span>
              <AppIcon v-if="locale === option.code" name="check" :size="18" :stroke-width="2.6" />
              <AppIcon v-else name="chevron" :size="18" class="lang-card__chevron" />
            </button>
          </div>
        </section>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Copy flows from the top; the CTA gets the remaining height (its own size container), so the
   two never overlap on short screens. */
.splash {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  container-type: size;
  overflow: hidden;
  cursor: pointer;
  background: var(--ink-900);
  color: var(--cream);
}
.splash:focus-visible {
  box-shadow: inset var(--focus-ring);
}
.splash__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: ken-burns 14s ease-out both;
}
/* Warm charcoal veil — same family as the Home palette, keeps text ≥ 4.5:1 */
.splash__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(44, 36, 23, 0.62) 0%,
    rgba(44, 36, 23, 0.3) 32%,
    rgba(44, 36, 23, 0) 50%,
    rgba(44, 36, 23, 0) 68%,
    rgba(44, 36, 23, 0.45) 100%
  );
}
.splash__location {
  position: absolute;
  top: calc(var(--chrome-top) + 12px);
  left: 28px;
  font: var(--t-micro);
  letter-spacing: var(--track-caps-wide);
  text-transform: uppercase;
}
.splash__location::after {
  content: '';
  display: block;
  width: 28px;
  height: 1.5px;
  margin-top: 10px;
  background: currentColor;
}
.splash__script {
  position: absolute;
  top: calc(var(--chrome-top) + 36px);
  right: 24px;
  font: var(--t-script);
  transform: rotate(-7deg);
  text-shadow: 0 2px 12px rgba(44, 36, 23, 0.35);
}
.splash__script span {
  display: block;
  padding-left: 22px;
}
.splash__script svg {
  display: block;
  margin: 4px 0 0 34px;
}
.splash__copy {
  position: relative;
  margin: clamp(164px, 21cqh, 176px) 28px 0; /* clears the tilted script */
}
.splash__eyebrow {
  font: var(--t-micro);
  letter-spacing: var(--track-caps-wide);
  text-transform: uppercase;
}
.splash__title {
  margin-top: clamp(8px, 1.7cqh, 14px);
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: var(--track-hero);
  color: var(--cream);
  text-shadow: 0 2px 24px rgba(44, 36, 23, 0.4);
}
.splash__title-main {
  display: block;
  font-size: clamp(40px, 6.2cqh, 52px);
}
.splash__title-sub {
  display: block;
  margin-top: 4px;
  font-size: clamp(31px, 4.8cqh, 40px);
}
.splash__rule {
  display: block;
  width: 44px;
  height: 3px;
  margin: clamp(12px, 2.4cqh, 20px) 0 clamp(10px, 1.9cqh, 16px);
  border-radius: var(--r-pill);
  background: var(--brand-600);
}
.splash__cta {
  position: relative;
  flex: 1;
  min-height: 0;
  container-type: size;
  display: grid;
  place-items: center;
  margin: 12px 0 max(16px, 5cqh);
}
.splash__cta > * {
  grid-area: 1 / 1;
}
.splash.is-choosing {
  cursor: default;
}

/* ---- step 2: language card — frosted cream material over the photo ---- */
.lang-card {
  width: min(100% - 2 * var(--gutter), 360px);
  max-height: 100cqh;
  overflow-y: auto;
  padding: var(--s-4);
  border-radius: var(--r-xl);
  background: rgba(250, 246, 240, 0.9);
  -webkit-backdrop-filter: var(--material-blur);
  backdrop-filter: var(--material-blur);
  box-shadow: var(--e-2);
  color: var(--ink-700);
  scrollbar-width: none;
}
.lang-card__title {
  margin: 0 var(--s-1) var(--s-3);
  font: var(--t-h2);
  letter-spacing: var(--track-h1);
  color: var(--ink-900);
}
.lang-card__list {
  display: grid;
  gap: var(--s-2);
}
.lang-card__option {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-4);
  border: 1.5px solid var(--outline);
  border-radius: var(--r-md);
  background: var(--paper);
  color: var(--ink-900);
  text-align: left;
  transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease), scale var(--dur) var(--ease);
}
.lang-card__option.is-current {
  border-color: var(--brand-600);
  background: var(--brand-50);
  color: var(--brand-600);
}
.lang-card__text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.lang-card__text b {
  font: var(--t-h3);
  color: var(--ink-900);
}
.lang-card__text small {
  font: var(--t-meta);
  color: var(--ink-500);
}
.lang-card__chevron {
  color: var(--ink-500);
}

/* Tap-to-start gives way; the card materializes from the same spot (scale + blur resolve). */
.cta-enter-active,
.cta-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur-page) var(--ease-page),
    filter var(--dur-page) var(--ease-page);
}
.cta-leave-active {
  animation: none; /* the entrance `rise` (fill: both) would otherwise pin its opacity */
}
.cta-enter-from {
  opacity: 0;
  transform: scale(calc(1 - 0.12 * var(--motion)));
  filter: blur(calc(10px * var(--motion)));
}
.cta-leave-to {
  opacity: 0;
  transform: scale(calc(1 + 0.15 * var(--motion)));
}
@media (prefers-reduced-transparency: reduce) {
  .lang-card {
    background: var(--cream);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

/* ---- entrance choreography ---- */
.rise,
.rise-tilted {
  animation: 0.8s var(--ease) both;
}
.rise { animation-name: rise; }
.rise-tilted { animation-name: rise-tilted; animation-delay: 0.15s; }
.d1 { animation-delay: 0.15s; }
.d2 { animation-delay: 0.3s; }
.d3 { animation-delay: 0.45s; }
.d4 { animation-delay: 0.7s; }

@media (prefers-reduced-motion: reduce) {
  .splash__photo {
    animation: none; /* slow full-screen zoom is vestibular motion */
  }
}
@keyframes ken-burns {
  from { transform: scale(1.12); }
  to { transform: scale(1); }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(calc(14px * var(--motion))); }
}
@keyframes rise-tilted {
  from { opacity: 0; transform: rotate(-7deg) translateY(calc(10px * var(--motion))); }
  to { opacity: 1; transform: rotate(-7deg); }
}
</style>
