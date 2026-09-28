<script setup>
/**
 * Phone mock-up only on desktops/laptops (wide screen + mouse). Phones and tablets get the app
 * full-bleed at the screen's own size — same query as tokens.css (--safe-top) and StatusBar.vue.
 */
import { defineAsyncComponent, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

/* Design notes (RTM) beside the phone — only on a desktop wide enough for them. Its own chunk,
   loaded only then; open/closed is remembered per browser. */
const DesignNotes = defineAsyncComponent(() => import('./DesignNotes.vue'))
const wideQuery = window.matchMedia('(min-width: 960px) and (hover: hover) and (pointer: fine)')
const wide = ref(wideQuery.matches)
const onWide = (e) => (wide.value = e.matches)
wideQuery.addEventListener('change', onWide)
onBeforeUnmount(() => wideQuery.removeEventListener('change', onWide))

const NOTES_KEY = 'design-notes-open'
let saved = null
try {
  saved = localStorage.getItem(NOTES_KEY)
} catch {
  /* storage blocked: default to open */
}
const notesOpen = ref(saved !== '0')
function toggleNotes() {
  notesOpen.value = !notesOpen.value
  try {
    localStorage.setItem(NOTES_KEY, notesOpen.value ? '1' : '0')
  } catch {
    /* not remembered, still works */
  }
}
</script>

<template>
  <div class="stage">
    <div class="stage__row">
      <span class="stage__side" aria-hidden="true" />
      <div class="device">
        <slot />
      </div>
      <div class="stage__side stage__side--notes no-print">
        <DesignNotes v-if="wide" :open="notesOpen" @toggle="toggleNotes" />
      </div>
    </div>
    <p class="stage__credit no-print">{{ t('common.credit') }}</p>
  </div>
</template>

<style scoped>
.stage {
  /* desktop: exactly one screen tall, never scrolls — the mock-up doesn't drift up and down */
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  padding: var(--s-5) 0;
}
.stage__row {
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* the phone stays centred; notes use the right-hand space */
  align-items: center;
  gap: var(--s-8);
  width: 100%;
  padding: 0 var(--s-8);
}
.stage__side--notes {
  align-self: stretch;
  display: flex;
  min-width: 0;
  max-width: 24rem;
  /* same height as the phone, so the notes scroll inside it and the page never does */
  height: min(844px, calc(100dvh - 2 * var(--s-5) - var(--s-3) - 1rem));
}
.device {
  position: relative;
  /* fills what's left after the padding, the gap and the one-line credit (t-meta = 1rem) */
  height: min(844px, calc(100vh - 2 * var(--s-5) - var(--s-3) - 1rem));
  height: min(844px, calc(100dvh - 2 * var(--s-5) - var(--s-3) - 1rem));
  flex-shrink: 0;
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
  color: var(--stage-text);
}
@media not all and (min-width: 601px) and (hover: hover) and (pointer: fine) {
  .stage {
    /* 100vh is taller than the visible area while the browser bar shows → the app got centred
       with dark strips above/below. Match the device to the dynamic viewport exactly. */
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    padding: 0;
    gap: 0;
    background: var(--cream);
  }
  .device {
    width: 100%;
    height: 100dvh;
    box-shadow: none;
    aspect-ratio: auto;
    border-radius: 0;
  }
  .stage__credit {
    display: none;
  }
  .stage__row {
    display: block;
    padding: 0;
  }
  .stage__side {
    display: none;
  }
}
@media print {
  .stage {
    display: block;
    height: auto;
    overflow: visible;
    padding: 0;
  }
  .stage__row {
    display: block;
    padding: 0;
  }
  .stage__side {
    display: none;
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
