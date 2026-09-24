import { defineStore } from 'pinia'
import { CONDITIONS, LIVE_WEATHER, LIVE_WEATHER_INTERVAL_MS } from '@/data/weather'

let timer = null

/** Simulated current weather: steps through LIVE_WEATHER on a timer (prototype only). */
export const useWeatherStore = defineStore('weather', {
  state: () => ({ index: 0 }),

  getters: {
    current: (state) => LIVE_WEATHER[state.index],
    icon: (state) => CONDITIONS[LIVE_WEATHER[state.index].condition].icon,
  },

  actions: {
    advance() {
      this.index = (this.index + 1) % LIVE_WEATHER.length
    },
    /** Start the simulation once; later calls are no-ops. */
    start() {
      if (!timer) timer = setInterval(() => this.advance(), LIVE_WEATHER_INTERVAL_MS)
    },
    stop() {
      clearInterval(timer)
      timer = null
    },
  },
})
