<script setup>
/**
 * Phone mock-up only on desktops/laptops (wide screen + mouse). Phones and tablets get the app
 * full-bleed at the screen's own size — same query as tokens.css (--safe-top) and StatusBar.vue.
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="stage">
    <div class="device">
      <slot />
    </div>
    <p class="stage__credit no-print">{{ t('common.credit') }}</p>
  </div>
</template>

<style scoped>
.stage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  padding: var(--s-5) 0;
}
.device {
  position: relative;
  height: min(844px, 95vh);
  aspect-ratio: 390 / 844;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 44px;
  background: var(--cream);
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.stage__credit {
  font: var(--t-meta);
  font-weight: 500;
  color: #8c826f;
}
@media not all and (min-width: 601px) and (hover: hover) and (pointer: fine) {
  .stage {
    padding: 0;
  }
  .device {
    width: 100vw;
    height: 100dvh;
    aspect-ratio: auto;
    border-radius: 0;
  }
  .stage__credit {
    display: none;
  }
}
@media print {
  .stage {
    display: block;
    padding: 0;
  }
  .device {
    height: auto;
    aspect-ratio: auto;
    border-radius: 0;
    box-shadow: none;
    overflow: visible;
  }
}
</style>
