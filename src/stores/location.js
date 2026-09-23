import { defineStore } from 'pinia'
import { DEFAULT_ORIGIN, HOBART_CENTRE, HOBART_RADIUS_KM } from '@/data/navigation'
import { distanceKm, roundKm, walkingMinutes } from '@/lib/geo'

let watchId = null

/**
 * The walker's real position (browser Geolocation API).
 * Distances are measured from the walker when they are in Hobart; otherwise
 * (not yet located, permission denied, or elsewhere in the world) from the
 * default origin — Centenary Building, Dynnyrne (see data/navigation.js).
 *
 * status: idle → locating → active | denied | unavailable
 */
export const useLocationStore = defineStore('location', {
  state: () => ({
    status: 'idle',
    /** @type {{lat:number,lng:number}|null} */
    coords: null,
    /** metres */
    accuracy: null,
  }),

  getters: {
    isInHobart: (state) => Boolean(state.coords) && distanceKm(state.coords, HOBART_CENTRE) <= HOBART_RADIUS_KM,
    /** Point distances are measured from. */
    origin() {
      return this.isInHobart ? this.coords : DEFAULT_ORIGIN
    },
    /** i18n key describing where distances are measured from. */
    originLabelKey() {
      return this.isInHobart ? 'location.fromYou' : 'location.fromDefault'
    },
    /** @returns {(site: {coordinates:{lat:number,lng:number}}) => {km:number, minutes:number}} */
    distanceTo() {
      return (site) => {
        const km = distanceKm(this.origin, site.coordinates)
        return { km: roundKm(km), minutes: walkingMinutes(km) }
      }
    },
  },

  actions: {
    /** Start watching the position. Safe to call repeatedly. */
    start() {
      if (watchId !== null) return
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        this.status = 'unavailable'
        return
      }
      this.status = this.coords ? 'active' : 'locating'
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.coords = { lat: position.coords.latitude, lng: position.coords.longitude }
          this.accuracy = position.coords.accuracy
          this.status = 'active'
        },
        (error) => {
          this.status = error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
          this.stop()
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
      )
    },
    stop() {
      if (watchId !== null && typeof navigator !== 'undefined') navigator.geolocation.clearWatch(watchId)
      watchId = null
    },
  },
})
