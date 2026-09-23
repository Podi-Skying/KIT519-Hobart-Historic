import { defineStore } from 'pinia'
import { getSiteById } from '@/data/sites'
import { getNarration, NARRATION_LANGUAGES } from '@/data/narration'

let ticker = null

/**
 * Audio-tour playback (simulated clock — swap `play/pause` for an
 * HTMLAudioElement when real recordings exist).
 */
export const usePlayerStore = defineStore('player', {
  state: () => ({
    siteId: 1,
    playing: false,
    position: 46,
    showTranscript: false,
    language: NARRATION_LANGUAGES[0],
  }),

  getters: {
    site: (state) => getSiteById(state.siteId),
    narration() {
      return getNarration(this.site)
    },
    duration() {
      return this.narration.durationSeconds
    },
    remaining() {
      return this.duration - this.position
    },
    /** Index of the transcript line being narrated. */
    currentLine() {
      const lines = this.narration.transcript.length
      return Math.min(lines - 1, Math.floor((this.position / this.duration) * lines))
    },
  },

  actions: {
    load(siteId) {
      if (siteId === this.siteId) return
      this.pause()
      this.siteId = siteId
      this.position = 0
    },
    play() {
      if (this.playing) return
      if (this.position >= this.duration) this.position = 0
      this.playing = true
      ticker = setInterval(() => {
        this.position = Math.min(this.duration, this.position + 1)
        if (this.position >= this.duration) this.pause()
      }, 1000)
    },
    pause() {
      this.playing = false
      clearInterval(ticker)
      ticker = null
    },
    toggle() {
      this.playing ? this.pause() : this.play()
    },
    seek(seconds) {
      this.position = Math.max(0, Math.min(this.duration, seconds))
    },
    skip(deltaSeconds) {
      this.seek(this.position + deltaSeconds)
    },
    toggleTranscript() {
      this.showTranscript = !this.showTranscript
    },
    cycleLanguage() {
      const next = (NARRATION_LANGUAGES.indexOf(this.language) + 1) % NARRATION_LANGUAGES.length
      this.language = NARRATION_LANGUAGES[next]
    },
  },
})
