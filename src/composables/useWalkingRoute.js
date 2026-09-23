import { computed, ref, toValue, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { planRouteOptions, routeMinutes } from '@/services/routeOptions'
import { isRoutingConfigured } from '@/services/routes'
import { getSiteById } from '@/data/sites'
import { ROUTE_TYPES } from '@/data/navigation'
import { distanceKm, walkingMinutes } from '@/lib/geo'
import { walkMinutesFor } from '@/lib/sites'
import { useLocationStore } from '@/stores/location'
import { useTripStore } from '@/stores/trip'

/** Only re-plan when the walker has moved this far (GPS jitter is ignored). */
const REROUTE_METERS = 50

/**
 * Walking routes (Google Routes API + terrain) from the walker to a site,
 * through any heritage-site stops. Plans Normal / Accessible / Steep once and
 * exposes whichever the user selected.
 *
 * status: 'idle' | 'loading' | 'ready' | 'fallback'
 * On 'fallback' (routing not configured / API error) the path is a straight
 * line and times are estimates, so every screen keeps working.
 *
 * @param {import('vue').MaybeRefOrGetter<{id:number, coordinates:{lat:number,lng:number}} | null>} siteSource
 */
export function useWalkingRoute(siteSource) {
  const location = useLocationStore()
  const trip = useTripStore()
  const { locale } = useI18n()

  const options = ref(null)
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
      options.value = null
      status.value = 'idle'
      return
    }
    if (!isRoutingConfigured()) {
      status.value = 'fallback'
      return
    }
    const movedMeters = lastOrigin ? distanceKm(lastOrigin, origin.value) * 1000 : Infinity
    if (!force && options.value && movedMeters < REROUTE_METERS) return

    const id = ++requestId
    if (!options.value) status.value = 'loading'
    try {
      const result = await planRouteOptions({
        origin: origin.value,
        destination: destination.coordinates,
        intermediates: stopSites.value.map((s) => s.coordinates),
      })
      if (id !== requestId) return // superseded by a newer request
      options.value = result
      lastOrigin = { ...origin.value }
      status.value = 'ready'
      error.value = null
    } catch (e) {
      if (id !== requestId) return
      options.value = null
      error.value = e
      status.value = 'fallback'
      if (import.meta.env.DEV) console.warn('[useWalkingRoute] using straight-line fallback:', e.message)
    }
  }

  watch(
    () => [site.value?.id, stopSites.value.map((s) => s.id).join(), locale.value],
    () => load(true),
    { immediate: true },
  )
  watch(() => [origin.value.lat, origin.value.lng], () => load(false))

  /** The route for the selected type (null until planned / in fallback). */
  const route = computed(() => options.value?.[trip.routeType] ?? null)

  const straightKm = computed(() => (site.value ? distanceKm(origin.value, site.value.coordinates) : 0))

  /**
   * Summary for any route type — used by the picker to show all three.
   * @returns {{minutes:number, distanceMeters:number, climbMeters:number|null, maxGrade:number|null, via:string|null, sameAsNormal:boolean}}
   */
  function summary(typeKey) {
    const option = options.value?.[typeKey]
    if (option) {
      return {
        minutes: routeMinutes(option),
        distanceMeters: option.distanceMeters,
        climbMeters: option.climbMeters,
        maxGrade: option.maxGrade,
        via: option.via,
        sameAsNormal: typeKey !== 'normal' && option === options.value.normal,
      }
    }
    // Fallback estimate: straight-line walking time scaled by the route type.
    const base = walkingMinutes(straightKm.value)
    return {
      minutes: walkMinutesFor({ walkMinutes: base }, typeKey),
      distanceMeters: Math.round(straightKm.value * 1000),
      climbMeters: null,
      maxGrade: null,
      via: null,
      sameAsNormal: false,
    }
  }

  const summaries = computed(() => Object.fromEntries(ROUTE_TYPES.map((t) => [t.key, summary(t.key)])))

  /** Map path: the selected real route, or a straight line origin → stops → destination. */
  const path = computed(() => {
    if (route.value) return route.value.path
    if (!site.value) return []
    return [origin.value, ...stopSites.value.map((s) => s.coordinates), site.value.coordinates]
  })

  return {
    options,
    route,
    status,
    error,
    path,
    summaries,
    minutes: computed(() => summaries.value[trip.routeType].minutes),
    distanceMeters: computed(() => summaries.value[trip.routeType].distanceMeters),
    selectedSummary: computed(() => summaries.value[trip.routeType]),
    stopSites,
    isRealRoute: computed(() => status.value === 'ready' && Boolean(route.value)),
    reload: () => load(true),
  }
}
