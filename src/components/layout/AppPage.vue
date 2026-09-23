<script setup>
/**
 * Scrollable page container used by every scrolling view.
 *  - reports scroll position so the status bar can turn solid
 *  - keeps scroll position when the view is cached by <KeepAlive>
 *  - `safeTop` pads content below the floating status bar
 */
import { onActivated, onDeactivated, onMounted, ref } from 'vue'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  background: { type: String, default: 'cream', validator: (v) => ['cream', 'paper'].includes(v) },
  safeTop: { type: Boolean, default: true },
  /** Scroll distance (px) after which the status bar gets a solid background. */
  solidAfter: { type: Number, default: 0 },
})

const ui = useUiStore()
const scroller = ref(null)
let savedScroll = 0

const sync = () => ui.setStatusBarSolid((scroller.value?.scrollTop ?? 0) > props.solidAfter)

onMounted(sync)
onActivated(() => {
  if (scroller.value) scroller.value.scrollTop = savedScroll
  sync()
})
onDeactivated(() => {
  savedScroll = scroller.value?.scrollTop ?? 0
})

defineExpose({ scroller })
</script>

<template>
  <main
    ref="scroller"
    class="page"
    :class="[`page--${background}`, { 'page--safe-top': safeTop }]"
    @scroll.passive="sync"
  >
    <slot />
  </main>
</template>

<style scoped>
.page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.page::-webkit-scrollbar {
  display: none;
}
.page--cream {
  background: var(--cream);
}
.page--paper {
  background: var(--paper);
}
.page--safe-top {
  padding-top: var(--safe-top);
}
@media print {
  .page {
    overflow: visible;
  }
}
</style>
