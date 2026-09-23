<script setup>
/** Leading page — shown on every launch; any tap/Enter/Space starts the app. */
import { onMounted, ref } from 'vue'
import TapToStart from './TapToStart.vue'
import splashImage from '@/assets/images/splash-bg.jpg'

const emit = defineEmits(['start'])
const root = ref(null)

onMounted(() => root.value?.focus({ preventScroll: true }))
</script>

<template>
  <div
    ref="root"
    class="splash"
    role="button"
    tabindex="0"
    aria-label="Hobart Heritage Guide — tap to start"
    @click="emit('start')"
    @keydown.enter.prevent="emit('start')"
    @keydown.space.prevent="emit('start')"
  >
    <img class="splash__photo" :src="splashImage" alt="" fetchpriority="high" />
    <div class="splash__veil" />

    <p class="splash__location rise">Hobart, Tasmania</p>

    <p class="splash__script rise-tilted" aria-hidden="true">
      Small city,<span>big stories</span>
      <svg width="96" height="10" viewBox="0 0 96 10">
        <path d="M2 8C30 2 62 1 94 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </p>

    <div class="splash__copy">
      <p class="splash__eyebrow rise d1">Walk through history</p>
      <h1 class="splash__title rise d2">
        <span class="splash__title-main">Hobart</span>
        <span class="splash__title-sub">Heritage Guide</span>
      </h1>
      <span class="splash__rule rise d3" />
      <p class="splash__lead rise d3">
        Discover historic places, follow walking routes, and reveal the past through augmented reality.
      </p>
    </div>

    <TapToStart class="splash__cta rise-centered d4" />
  </div>
</template>

<style scoped>
.splash {
  position: absolute;
  inset: 0;
  z-index: 100;
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
  position: absolute;
  top: 176px;
  left: 28px;
  right: 28px;
}
.splash__eyebrow {
  font: 600 11px var(--font-label);
  letter-spacing: 0.28em;
  text-transform: uppercase;
}
.splash__title {
  margin-top: 14px;
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.02;
  color: #fffaf3;
  text-shadow: 0 2px 24px rgba(44, 36, 23, 0.4);
}
.splash__title-main {
  display: block;
  font-size: 52px;
}
.splash__title-sub {
  display: block;
  margin-top: 4px;
  font-size: 40px;
}
.splash__rule {
  display: block;
  width: 44px;
  height: 3px;
  margin: 20px 0 16px;
  border-radius: 2px;
  background: var(--brand-600);
}
.splash__lead {
  max-width: 290px;
  font: 400 15px/23px var(--font-body);
  text-shadow: 0 1px 10px rgba(44, 36, 23, 0.4);
}
.splash__cta {
  position: absolute;
  left: 50%;
  bottom: 17%;
  transform: translateX(-50%);
}

/* ---- entrance choreography ---- */
.rise,
.rise-tilted,
.rise-centered {
  animation: 0.8s var(--ease) both;
}
.rise { animation-name: rise; }
.rise-tilted { animation-name: rise-tilted; animation-delay: 0.15s; }
.rise-centered { animation-name: rise-centered; }
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
@keyframes rise-centered {
  from { opacity: 0; transform: translate(-50%, 14px); }
  to { opacity: 1; transform: translateX(-50%); }
}
</style>
