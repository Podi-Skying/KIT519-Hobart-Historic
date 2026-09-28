<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { prefetchRoutes } from '@/router'
import DeviceFrame from '@/components/layout/DeviceFrame.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import TabBar from '@/components/layout/TabBar.vue'
import AppToast from '@/components/layout/AppToast.vue'
import SplashScreen from '@/components/splash/SplashScreen.vue'
import { useUiStore } from '@/stores/ui'
import { usePrefsStore } from '@/stores/prefs'
import { useWeatherStore } from '@/stores/weather'
import { usePageTransition } from '@/composables/usePageTransition'

const route = useRoute()
const ui = useUiStore()
const prefs = usePrefsStore()

// Prototype: simulated weather changes every 10 s (Weather tab icon + page).
const weather = useWeatherStore()
weather.start()
// Background tab: no timers ticking for nobody (battery), resume on return.
document.addEventListener('visibilitychange', () => (document.hidden ? weather.stop() : weather.start()))

// Display preferences switch tokens on <html> (tokens.css › Larger text / High contrast).
watchEffect(() => {
  document.documentElement.dataset.text = prefs.largeText ? 'large' : 'default'
  document.documentElement.dataset.contrast = prefs.highContrast ? 'high' : 'default'
})

// Route transitions are spring-driven and reversible mid-way (composables/usePageTransition).
let previousPath = route.path
watch(
  () => route.path,
  (_, old) => (previousPath = old),
)
const pageMotion = usePageTransition({
  kind: () => route.meta.transition ?? 'none',
  path: () => route.path,
  previousPath: () => previousPath,
})

/** Leading page shows on every launch, above whichever route was opened. */
const showSplash = ref(true)
const viewport = ref(null)

// While the splash is up, fetch the other pages' code so the first tap after it is instant.
onMounted(() => {
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 600))
  idle(() => prefetchRoutes())
})

/**
 * Home is rendered underneath the splash while it is inert and fully covered. iOS Safari can
 * keep a stale touch map for that scroll container after the cover goes away, so the first
 * taps on Home do nothing until the page scrolls once. A 1px scroll round-trip (invisible)
 * makes WebKit rebuild it; it is a no-op elsewhere.
 */
function wakeViewport() {
  const scroller = viewport.value?.querySelector('.page')
  if (!scroller || scroller.scrollHeight <= scroller.clientHeight) return
  const y = scroller.scrollTop
  scroller.scrollTop = y + 1
  requestAnimationFrame(() => (scroller.scrollTop = y))
}

const statusBar = computed(() => {
  const config = route.meta.status ?? {}
  const solid = ui.statusBarSolid && Boolean(config.solidBg)
  return solid
    ? { tone: config.solidTone ?? 'dark', background: config.solidBg }
    : { tone: config.tone ?? 'dark', background: 'transparent' }
})
</script>

<template>
  <DeviceFrame>
    <StatusBar :tone="statusBar.tone" :background="statusBar.background" />

    <!-- inert while the splash covers it: not focusable / not read out / not tappable -->
    <div ref="viewport" class="viewport" :inert="showSplash">
      <RouterView v-slot="{ Component }">
        <!-- No out-in: old and new page animate together, so a tap never waits on an exit.
             JS hooks (springs), not CSS classes, so a push can be reversed mid-way. -->
        <Transition :css="false" @enter="pageMotion.onEnter" @leave="pageMotion.onLeave">
          <KeepAlive include="HomeView">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>

    <TabBar v-if="!route.meta.hideTabBar" :inert="showSplash" />
    <!-- Modal sheets teleport here (BottomSheet), outside the page they belong to -->
    <div id="sheet-layer" />
    <AppToast />

    <Transition name="splash" @after-leave="wakeViewport">
      <SplashScreen v-if="showSplash" @start="showSplash = false" />
    </Transition>
  </DeviceFrame>
</template>

<style scoped>
.viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.viewport > :deep(*) {
  flex: 1;
  min-height: 0;
}
.splash-leave-active {
  /* short, so Home is usable almost the moment you tap (the page is already rendered underneath) */
  transition: opacity var(--dur-page) var(--ease), transform var(--dur-page) var(--ease);
  pointer-events: none;
}
.splash-leave-to {
  opacity: 0;
  transform: scale(calc(1 + 0.04 * var(--motion)));
}
</style>
