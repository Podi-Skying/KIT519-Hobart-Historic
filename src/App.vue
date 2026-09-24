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

const route = useRoute()
const ui = useUiStore()
const prefs = usePrefsStore()

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
        <Transition name="page" mode="out-in">
          <KeepAlive include="HomeView">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>

    <TabBar v-if="!route.meta.hideTabBar" />
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
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.splash-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
</style>
