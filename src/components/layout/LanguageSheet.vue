<script setup>
/**
 * Language & display: switches all UI text, site content and narration voice, plus reading
 * comfort (larger text, high contrast). Picking a language closes the sheet; the display
 * switches don't, so both can be tried in place.
 */
import { useI18n } from 'vue-i18n'
import BottomSheet from '@/components/base/BottomSheet.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { LOCALES, setLocale } from '@/i18n'
import { usePrefsStore } from '@/stores/prefs'

const emit = defineEmits(['close'])
const { t, locale } = useI18n()
const prefs = usePrefsStore()

const DISPLAY = [
  { key: 'largeText', icon: 'text', toggle: () => prefs.toggleLargeText() },
  { key: 'highContrast', icon: 'contrast', toggle: () => prefs.toggleHighContrast() },
]

function choose(code, dismiss) {
  setLocale(code)
  dismiss()
}
</script>

<template>
  <BottomSheet :label="t('language.sheetTitle')" :title="t('language.sheetTitle')" :subtitle="t('language.subtitle')" @close="emit('close')">
    <template #default="{ dismiss }">
      <p class="t-caption group-label">{{ t('display.title') }}</p>
      <ul class="options">
        <li v-for="option in DISPLAY" :key="option.key">
          <button
            type="button"
            role="switch"
            class="option"
            :class="{ 'is-selected': prefs[option.key] }"
            :aria-checked="prefs[option.key]"
            @click="option.toggle"
          >
            <span class="option__icon" aria-hidden="true"><AppIcon :name="option.icon" :size="20" /></span>
            <span class="option__text">
              <b>{{ t(`display.${option.key}`) }}</b>
              <small>{{ t(`display.${option.key}Hint`) }}</small>
            </span>
            <span class="switch" aria-hidden="true"><span class="switch__knob" /></span>
          </button>
        </li>
      </ul>

      <p class="t-caption group-label">{{ t('language.title') }}</p>
      <div class="options" role="radiogroup" :aria-label="t('language.title')">
        <button
          v-for="option in LOCALES"
          :key="option.code"
          type="button"
          role="radio"
          class="option"
          :class="{ 'is-selected': locale === option.code }"
          :aria-checked="locale === option.code"
          :lang="option.code"
          @click="choose(option.code, dismiss)"
        >
          <span class="option__text">
            <b>{{ option.label }}</b>
            <small lang="en">{{ option.english }}</small>
          </span>
          <span class="option__check" aria-hidden="true">
            <AppIcon v-if="locale === option.code" name="check" :size="16" :stroke-width="3" />
          </span>
        </button>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
.group-label {
  margin: var(--s-2) 0 var(--s-2);
}
.group-label + .options {
  margin-bottom: var(--s-4);
}
.options {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.option {
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  text-align: left;
  transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
}
.option.is-selected {
  border-color: var(--brand-600);
  background: var(--brand-50);
}
.option__icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  background: var(--sand-fill);
  color: var(--ink-900);
}
.option__text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.option__text b {
  font: 600 16px/22px var(--font-label);
  color: var(--ink-900);
}
.option__text small {
  font: 400 12px var(--font-body);
  color: var(--ink-500);
}
.option__check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--sand-dark);
  color: var(--paper);
}
.option.is-selected .option__check {
  border-color: var(--brand-600);
  background: var(--brand-600);
}
/* On/off switch — the knob position, not colour alone, shows the state */
.switch {
  width: 44px;
  height: 26px;
  flex-shrink: 0;
  padding: 3px;
  border-radius: var(--r-pill);
  background: var(--sand-dark);
  transition: background var(--dur) var(--ease);
}
.switch__knob {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--paper);
  box-shadow: var(--e-1);
  transition: transform var(--dur) var(--ease);
}
.option.is-selected .switch {
  background: var(--brand-600);
}
.option.is-selected .switch__knob {
  transform: translateX(18px);
}
</style>
