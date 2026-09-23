<script setup>
/** Phone mock-up on desktop; full-bleed on real phones (≤ 430px wide). */
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
  font: 500 11px var(--font-body);
  color: #8c826f;
}
@media (max-width: 430px) {
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
