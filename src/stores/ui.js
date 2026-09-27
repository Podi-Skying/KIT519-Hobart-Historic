import { defineStore } from 'pinia'

let toastTimer = null

/** App-shell UI state: toast messages and the status-bar background. */
export const useUiStore = defineStore('ui', {
  state: () => ({
    /** @type {{message: string, spinner: boolean, action: {label: string, run: () => void} | null} | null} */
    toast: null,
    /** True once the current page has scrolled past its hero. */
    statusBarSolid: false,
  }),

  actions: {
    /**
     * @param {string} message
     * @param {{ spinner?: boolean, duration?: number, action?: { label: string, run: () => void } }} [options]
     *   `action` adds a button (e.g. Undo); the toast then stays longer so there is time to reach it.
     */
    showToast(message, { spinner = false, duration, action = null } = {}) {
      clearTimeout(toastTimer)
      this.toast = { message, spinner, action }
      toastTimer = setTimeout(() => {
        this.toast = null
      }, duration ?? (action ? 4500 : 1800))
    },
    /** Run the toast's action (Undo) and dismiss it. */
    runToastAction() {
      const run = this.toast?.action?.run
      clearTimeout(toastTimer)
      this.toast = null
      run?.()
    },
    setStatusBarSolid(solid) {
      if (this.statusBarSolid !== solid) this.statusBarSolid = solid
    },
  },
})
