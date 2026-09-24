<script setup>
/** Leading page — shown on every launch; any tap/Enter/Space starts the app. */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TapToStart from './TapToStart.vue'
import splashImage from '@/assets/images/splash-bg.jpg'

const emit = defineEmits(['start'])
const { t } = useI18n()
const root = ref(null)

onMounted(() => root.value?.focus({ preventScroll: true }))
</script>

<template>
  <div
    ref="root"
    class="splash"
    role="button"
    tabindex="0"
    :aria-label="t('splash.aria')"
    @click="emit('start')"
    @keydown.enter.prevent="emit('start')"
    @keydown.space.prevent="emit('start')"
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
      <p class="splash__lead rise d3">
        {{ t('splash.lead') }}
      </p>
    </div>

    <div class="splash__cta">
      <TapToStart class="rise d4" :label="t('splash.tap')" />
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
  top: 62px;
  left: 28px;
  font: 600 11px var(--font-label);
  letter-spacing: 0.32em;
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
  top: 86px;
  right: 24px;
  font: 600 27px/26px var(--font-script);
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
  font: 600 11px var(--font-label);
  letter-spacing: 0.28em;
  text-transform: uppercase;
}
.splash__title {
  margin-top: clamp(8px, 1.7cqh, 14px);
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.02;
  color: #fffaf3;
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
  border-radius: 2px;
  background: var(--brand-600);
}
.splash__lead {
  max-width: 290px;
  font: 400 15px/23px var(--font-body);
  text-shadow: 0 1px 10px rgba(44, 36, 23, 0.4);
}
.splash__cta {
  position: relative;
  flex: 1;
  min-height: 0;
  container-type: size;
  display: grid;
  place-items: center;
  margin: 16px 0 max(24px, 6cqh);
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

@keyframes ken-burns {
  from { transform: scale(1.12); }
  to { transform: scale(1); }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
}
@keyframes rise-tilted {
  from { opacity: 0; transform: rotate(-7deg) translateY(10px); }
  to { opacity: 1; transform: rotate(-7deg); }
}
</style>
