import { defineStore } from 'pinia'

let toastTimer = null

/** App-shell UI state: toast messages and the status-bar background. */
export const useUiStore = defineStore('ui', {
  state: () => ({
    /** @type {{message: string, spinner: boolean} | null} */
    toast: null,
    /** True once the current page has scrolled past its hero. */
    statusBarSolid: false,
  }),

  actions: {
    showToast(message, { spinner = false, duration = 1800 } = {}) {
      clearTimeout(toastTimer)
      this.toast = { message, spinner }
      toastTimer = setTimeout(() => {
        this.toast = null
      }, duration)
    },
    setStatusBarSolid(solid) {
      if (this.statusBarSolid !== solid) this.statusBarSolid = solid
    },
  },
})
