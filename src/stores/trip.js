import { defineStore } from 'pinia'
import { getSiteById } from '@/data/sites'
import { DEFAULT_ROUTE_TYPE, MAX_STOPS, ROUTE_TYPES, WAYPOINTS } from '@/data/navigation'
import { walkMinutesFor } from '@/lib/sites'
import { useLocationStore } from './location'

/** The walk being planned: destination, route type, optional stops, map prefs. */
export const useTripStore = defineStore('trip', {
  state: () => ({
    /** @type {number|null} */
    destinationId: null,
    routeType: DEFAULT_ROUTE_TYPE,
    /** @type {string[]} waypoint ids, in the order added */
    stopIds: [],
    voiceGuidance: true,
    offlineMap: false,
  }),

  getters: {
    destination: (state) => (state.destinationId ? getSiteById(state.destinationId) : null),
    routeTypeConfig: (state) => ROUTE_TYPES.find((t) => t.key === state.routeType) ?? ROUTE_TYPES[0],
    stops: (state) => state.stopIds.map((id) => WAYPOINTS.find((w) => w.id === id)).filter(Boolean),
    hasStop: (state) => (id) => state.stopIds.includes(id),
    isFull: (state) => state.stopIds.length >= MAX_STOPS,
    /** Walking minutes to a site with the current route type, from the walker's live position. */
    minutesTo: (state) => (site) =>
      walkMinutesFor({ walkMinutes: useLocationStore().distanceTo(site).minutes }, state.routeType),
  },

  actions: {
    setDestination(siteId) {
      this.destinationId = siteId
    },
    clearDestination() {
      this.destinationId = null
    },
    setRouteType(key) {
      if (ROUTE_TYPES.some((t) => t.key === key)) this.routeType = key
    },
    /**
     * Add or remove a waypoint.
     * @returns {'added'|'removed'|'full'}
     */
    toggleStop(id) {
      if (this.hasStop(id)) {
        this.stopIds = this.stopIds.filter((s) => s !== id)
        return 'removed'
      }
      if (this.isFull) return 'full'
      this.stopIds = [...this.stopIds, id]
      return 'added'
    },
    toggleVoiceGuidance() {
      this.voiceGuidance = !this.voiceGuidance
    },
    toggleOfflineMap() {
      this.offlineMap = !this.offlineMap
    },
  },

  persist: { paths: ['routeType', 'stopIds', 'voiceGuidance', 'offlineMap'] },
})
