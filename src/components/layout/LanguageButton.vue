<script setup>
/** Globe + current language badge; opens the language picker. */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import LanguageSheet from './LanguageSheet.vue'
import { localeInfo } from '@/i18n'

const { t, locale } = useI18n()
const open = ref(false)
const current = computed(() => localeInfo(locale.value))
</script>

<template>
  <button
    type="button"
    class="language-button"
    :aria-label="t('language.button', { language: current.label })"
    aria-haspopup="dialog"
    @click="open = true"
  >
    <AppIcon name="globe" :size="18" />
    <span>{{ current.short }}</span>
  </button>
  <!-- Rendered at device level so the sheet covers the whole screen, not just the scrolling page -->
  <Teleport to=".device" defer>
    <LanguageSheet v-if="open" @close="open = false" />
  </Teleport>
</template>

<style scoped>
.language-button {
  height: var(--hit);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  background: var(--sand);
  color: var(--ink-900);
  font: 700 12px var(--font-label);
  white-space: nowrap;
}
</style>
