import { defineStore } from 'pinia'
import { getSiteById } from '@/data/sites'
import { estimateSeconds } from '@/data/narration'
import { i18n, localeInfo } from '@/i18n'
import { localizeNarration } from '@/i18n/content'
import { isSpeechSupported, loadVoices, pickVoice, speak, stopSpeaking } from '@/services/speech'

const TICK_MS = 250
let ticker = null
/** Incremented on every pause/seek so an in-flight speech loop knows it was superseded. */
let session = 0

/**
 * Audio tour: reads the narration aloud line by line with the device's
 * text-to-speech voice for the current app language.
 * Position is tracked per line (lineIndex + seconds into that line) using
 * estimated line durations; seeking snaps to the start of a line.
 * Without speech support (old browsers, tests) the same clock runs silently.
 */
export const usePlayerStore = defineStore('player', {
  state: () => ({
    siteId: 1,
    playing: false,
    lineIndex: 0,
    lineElapsed: 0,
    showTranscript: false,
    /** 'ok' | 'missing' (no voice for this language) | 'unsupported' (no speech API) */
    voiceStatus: 'ok',
  }),

  getters: {
    locale: () => i18n.global.locale.value,
    site: (state) => getSiteById(state.siteId),
    narration() {
      return localizeNarration(this.siteId, this.locale)
    },
    lineDurations() {
      return this.narration.transcript.map(estimateSeconds)
    },
    duration() {
      return this.lineDurations.reduce((sum, d) => sum + d, 0)
    },
    position() {
      const before = this.lineDurations.slice(0, this.lineIndex).reduce((sum, d) => sum + d, 0)
      return Math.min(this.duration, before + this.lineElapsed)
    },
    remaining() {
      return Math.max(0, this.duration - this.position)
    },
    /** Index of the line being narrated (for transcript highlighting). */
    currentLine() {
      return Math.min(this.lineIndex, this.narration.transcript.length - 1)
    },
    speechTags() {
      return localeInfo(this.locale).speech
    },
  },

  actions: {
    load(siteId) {
      if (siteId === this.siteId) return
      this.reset()
      this.siteId = siteId
    },
    /** Stop and go back to the beginning (e.g. after a language change). */
    reset() {
      this.pause()
      this.lineIndex = 0
      this.lineElapsed = 0
    },

    play() {
      if (this.playing) return
      if (this.lineIndex >= this.narration.transcript.length) {
        this.lineIndex = 0
        this.lineElapsed = 0
      }
      this.playing = true
      this.runFrom(++session)
    },

    pause() {
      session++
      this.playing = false
      this.lineElapsed = 0 // resume restarts the current line from its beginning
      this.stopTicker()
      stopSpeaking()
    },

    toggle() {
      this.playing ? this.pause() : this.play()
    },

    seek(seconds) {
      const target = Math.max(0, Math.min(this.duration, seconds))
      let start = 0
      let index = this.lineDurations.findIndex((d) => {
        if (target < start + d) return true
        start += d
        return false
      })
      if (index === -1) index = this.lineDurations.length // at the very end
      const wasPlaying = this.playing
      this.pause()
      this.lineIndex = index
      if (wasPlaying && index < this.lineDurations.length) this.play()
    },

    skip(deltaSeconds) {
      this.seek(this.position + deltaSeconds)
    },

    toggleTranscript() {
      this.showTranscript = !this.showTranscript
    },

    // ---- internals ----
    startTicker() {
      this.stopTicker()
      const limit = this.lineDurations[this.lineIndex] ?? 0
      ticker = setInterval(() => {
        this.lineElapsed = Math.min(limit, this.lineElapsed + TICK_MS / 1000)
      }, TICK_MS)
    },
    stopTicker() {
      clearInterval(ticker)
      ticker = null
    },

    /** Narrate from the current line to the end, unless superseded by a newer session. */
    async runFrom(token) {
      const lines = this.narration.transcript
      const supported = isSpeechSupported()
      let voice = null
      if (supported) {
        voice = pickVoice(await loadVoices(), this.speechTags)
        this.voiceStatus = voice ? 'ok' : 'missing'
      } else {
        this.voiceStatus = 'unsupported'
      }

      while (token === session && this.lineIndex < lines.length) {
        this.lineElapsed = 0
        this.startTicker()
        try {
          const result = supported
            ? await speak(lines[this.lineIndex], { lang: this.speechTags[0], voice })
            : await new Promise((resolve) => setTimeout(() => resolve('ended'), this.lineDurations[this.lineIndex] * 1000))
          if (token !== session || result === 'cancelled') return
        } catch {
          if (token !== session) return
          this.voiceStatus = 'unsupported'
        }
        this.stopTicker()
        this.lineIndex += 1
        this.lineElapsed = 0
      }
      if (token === session) {
        this.stopTicker()
        this.playing = false
      }
    },
  },
})
