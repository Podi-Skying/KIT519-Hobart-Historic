import { defineStore } from 'pinia'

/**
 * Display preferences (Language & display sheet). App.vue mirrors them onto <html> as
 * `data-text` / `data-contrast`, which switch tokens in tokens.css.
 */
export const usePrefsStore = defineStore('prefs', {
  state: () => ({
    /** Scale page content up (for low vision / reading while walking). */
    largeText: false,
    /** Darker secondary text and outlines (WCAG 1.4.11 non-text contrast). */
    highContrast: false,
  }),

  actions: {
    toggleLargeText() {
      this.largeText = !this.largeText
    },
    toggleHighContrast() {
      this.highContrast = !this.highContrast
    },
  },

  persist: { paths: ['largeText', 'highContrast'] },
})
