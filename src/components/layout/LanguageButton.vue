<script setup>
/** Globe + current language + "Aa"; opens the Language & display sheet. */
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
    class="language-button pressable"
    data-req="FR14 NFR7"
    :aria-label="t('language.button', { language: current.label })"
    aria-haspopup="dialog"
    @click="open = true"
  >
    <AppIcon name="globe" :size="18" />
    <span>{{ current.short }}</span>
    <!-- "Aa" hints that text size & contrast live here too -->
    <span class="language-button__aa" aria-hidden="true">Aa</span>
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
  gap: 0.375rem;
  padding: 0 0.875rem;
  border-radius: var(--r-pill);
  background: var(--sand-fill);
  color: var(--ink-900);
  font: var(--t-label-sm);
  font-weight: 700;
  white-space: nowrap;
}
.language-button__aa {
  padding-left: 0.5rem;
  border-left: 1.5px solid var(--sand-dark);
  font: var(--t-label);
  font-family: var(--font-heading);
  font-weight: 700;
}
</style>
