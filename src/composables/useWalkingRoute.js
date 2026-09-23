import { computed, ref, toValue, watch } from 'vue'
import { fetchWalkingRoute, isRoutingConfigured } from '@/services/routes'
import { getSiteById } from '@/data/sites'
import { distanceKm, walkingMinutes } from '@/lib/geo'
import { walkMinutesFor } from '@/lib/sites'
import { useLocationStore } from '@/stores/location'
import { useTripStore } from '@/stores/trip'

/** Only re-request the route when the walker has moved this far (GPS jitter is ignored). */
const REROUTE_METERS = 50

/**
 * Real walking route (Google Routes API) from the walker's position to a site,
 * through any heritage-site stops the user added.
 *
 * status: 'idle' | 'loading' | 'ready' | 'fallback'
 * On 'fallback' (routing not configured / API error) `path` is a straight line and
 * durations are estimates, so every screen keeps working.
 *
 * @param {import('vue').MaybeRefOrGetter<{id:number, coordinates:{lat:number,lng:number}} | null>} siteSource
 */
export function useWalkingRoute(siteSource) {
  const location = useLocationStore()
  const trip = useTripStore()

  const route = ref(null)
  const status = ref('idle')
  const error = ref(null)
  let lastOrigin = null
  let requestId = 0

  const site = computed(() => toValue(siteSource))
  const origin = computed(() => location.origin)
  /** Heritage-site stops become real waypoints; amenity stops can't be routed. */
  const stopSites = computed(() =>
    trip.stops.filter((s) => s.siteId && s.siteId !== site.value?.id).map((s) => getSiteById(s.siteId)),
  )

  async function load(force = false) {
    const destination = site.value
    if (!destination) {
      route.value = null
      status.value = 'idle'
      return
    }
    if (!isRoutingConfigured()) {
      status.value = 'fallback'
      return
    }
    const movedMeters = lastOrigin ? distanceKm(lastOrigin, origin.value) * 1000 : Infinity
    if (!force && route.value && movedMeters < REROUTE_METERS) return

    const id = ++requestId
    status.value = route.value ? status.value : 'loading'
    try {
      const result = await fetchWalkingRoute({
        origin: origin.value,
        destination: destination.coordinates,
        intermediates: stopSites.value.map((s) => s.coordinates),
      })
      if (id !== requestId) return // a newer request superseded this one
      route.value = result
      lastOrigin = { ...origin.value }
      status.value = 'ready'
      error.value = null
    } catch (e) {
      if (id !== requestId) return
      route.value = null
      error.value = e
      status.value = 'fallback'
      if (import.meta.env.DEV) console.warn('[useWalkingRoute] using straight-line fallback:', e.message)
    }
  }

  watch(() => [site.value?.id, stopSites.value.map((s) => s.id).join()], () => load(true), { immediate: true })
  watch(() => [origin.value.lat, origin.value.lng], () => load(false))

  /** Map path: the real route, or a straight line origin → stops → destination. */
  const path = computed(() => {
    if (route.value) return route.value.path
    if (!site.value) return []
    return [origin.value, ...stopSites.value.map((s) => s.coordinates), site.value.coordinates]
  })

  /** Normal-route walking minutes (real when available, estimated otherwise). */
  const baseMinutes = computed(() => {
    if (route.value) return Math.max(1, Math.round(route.value.durationSeconds / 60))
    if (!site.value) return 0
    return walkingMinutes(distanceKm(origin.value, site.value.coordinates))
  })
  /** Minutes for the selected route type (Accessible / Steep scale the normal time). */
  const minutes = computed(() => walkMinutesFor({ walkMinutes: baseMinutes.value }, trip.routeType))
  const distanceMeters = computed(() => {
    if (route.value) return route.value.distanceMeters
    return site.value ? Math.round(distanceKm(origin.value, site.value.coordinates) * 1000) : 0
  })

  return {
    route,
    status,
    error,
    path,
    baseMinutes,
    minutes,
    distanceMeters,
    stopSites,
    isRealRoute: computed(() => status.value === 'ready'),
    reload: () => load(true),
  }
}
