<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import DeviceFrame from '@/components/layout/DeviceFrame.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import TabBar from '@/components/layout/TabBar.vue'
import AppToast from '@/components/layout/AppToast.vue'
import SplashScreen from '@/components/splash/SplashScreen.vue'
import { useUiStore } from '@/stores/ui'
import { usePrefsStore } from '@/stores/prefs'
import { useWeatherStore } from '@/stores/weather'

const route = useRoute()
const ui = useUiStore()
const prefs = usePrefsStore()

// Prototype: simulated weather changes every 10 s (Weather tab icon + page).
useWeatherStore().start()

// Display preferences switch tokens on <html> (tokens.css › Larger text / High contrast).
watchEffect(() => {
  document.documentElement.dataset.text = prefs.largeText ? 'large' : 'default'
  document.documentElement.dataset.contrast = prefs.highContrast ? 'high' : 'default'
})

/** Leading page shows on every launch, above whichever route was opened. */
const showSplash = ref(true)

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

    <div class="viewport">
      <RouterView v-slot="{ Component }">
        <!-- No out-in: old and new page animate together, so a tap never waits on an exit. -->
        <Transition :name="`page-${route.meta.transition ?? 'none'}`" :css="(route.meta.transition ?? 'none') !== 'none'">
          <KeepAlive include="HomeView">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>

    <TabBar v-if="!route.meta.hideTabBar" />
    <!-- Modal sheets teleport here (BottomSheet), outside the page they belong to -->
    <div id="sheet-layer" />
    <AppToast />

    <Transition name="splash">
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
  transition: opacity 300ms var(--ease), transform 300ms var(--ease);
  pointer-events: none;
}
.splash-leave-to {
  opacity: 0;
  transform: scale(calc(1 + 0.04 * var(--motion)));
}
</style>
