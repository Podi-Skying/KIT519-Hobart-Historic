/**
 * Google Maps JavaScript API loader.
 *
 * Configuration comes from Vite env vars (see .env.example):
 *   VITE_GOOGLE_MAPS_API_KEY  required — browser key, restrict it by HTTP referrer
 *   VITE_GOOGLE_MAPS_MAP_ID   optional — Cloud map style; falls back to Google's demo id
 *
 * Without a key the app keeps working with the illustrated fallback map.
 */
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

export const isGoogleMapsConfigured = () => API_KEY.trim().length > 0

let loading = null
const authFailureListeners = new Set()

/** Called by Google when the key is invalid / not authorised for this referrer. */
if (typeof window !== 'undefined') {
  window.gm_authFailure = () => authFailureListeners.forEach((fn) => fn())
}

/** Subscribe to key/authorisation failures that happen after the script loaded. */
export function onGoogleMapsAuthFailure(listener) {
  authFailureListeners.add(listener)
  return () => authFailureListeners.delete(listener)
}

/**
 * Load the Maps JS API once and resolve with the `maps` and `marker` libraries.
 * @returns {Promise<{ Map: any, Polyline: any, LatLngBounds: any, AdvancedMarkerElement: any }>}
 */
export function loadGoogleMaps() {
  if (!isGoogleMapsConfigured()) return Promise.reject(new Error('Google Maps API key is not configured'))
  if (loading) return loading

  loading = new Promise((resolve, reject) => {
    const callback = '__hobartHeritageMapsReady'
    window[callback] = async () => {
      delete window[callback]
      try {
        const [{ Map, Polyline }, { AdvancedMarkerElement }, { LatLngBounds }] = await Promise.all([
          window.google.maps.importLibrary('maps'),
          window.google.maps.importLibrary('marker'),
          window.google.maps.importLibrary('core'),
        ])
        resolve({ Map, Polyline, LatLngBounds, AdvancedMarkerElement })
      } catch (error) {
        reject(error)
      }
    }

    const params = new URLSearchParams({ key: API_KEY, v: 'weekly', loading: 'async', callback })
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.async = true
    script.onerror = () => {
      loading = null
      reject(new Error('Google Maps script failed to load'))
    }
    document.head.append(script)
  })

  return loading
}
