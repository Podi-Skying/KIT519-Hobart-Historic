import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFavoritesStore } from '@/stores/favorites'
import { useTripStore } from '@/stores/trip'
import { usePlayerStore } from '@/stores/player'
import { getSiteById } from '@/data/sites'
import { MAX_STOPS, WAYPOINTS } from '@/data/navigation'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('favorites store', () => {
  it('toggles a like and adjusts the count by one', () => {
    const favorites = useFavoritesStore()
    const site = getSiteById(2)
    expect(favorites.likeCount(site)).toBe(site.baseLikes)
    favorites.toggle(2)
    expect(favorites.isLiked(2)).toBe(true)
    expect(favorites.likeCount(site)).toBe(site.baseLikes + 1)
    favorites.toggle(2)
    expect(favorites.likeCount(site)).toBe(site.baseLikes)
  })

  it('ranks sites by like count', () => {
    const favorites = useFavoritesStore()
    expect(favorites.rankedSites[0].id).toBe(1)
  })
})

describe('trip store', () => {
  it(`caps stops at ${MAX_STOPS}`, () => {
    const trip = useTripStore()
    const results = WAYPOINTS.slice(0, MAX_STOPS + 1).map((w) => trip.toggleStop(w.id))
    expect(results).toEqual([...Array(MAX_STOPS).fill('added'), 'full'])
    expect(trip.stops).toHaveLength(MAX_STOPS)
  })

  it('removes a stop on second toggle', () => {
    const trip = useTripStore()
    trip.toggleStop('coffee')
    expect(trip.toggleStop('coffee')).toBe('removed')
    expect(trip.stopIds).toEqual([])
  })

  it('ignores unknown route types', () => {
    const trip = useTripStore()
    trip.setRouteType('helicopter')
    expect(trip.routeType).toBe('normal')
    const site = getSiteById(2)
    const normal = trip.minutesTo(site)
    trip.setRouteType('accessible')
    expect(trip.minutesTo(site)).toBe(Math.round(normal * 1.75))
  })
})

describe('player store', () => {
  it('seeks by line, clamps to the end and resets when loading another site', () => {
    const player = usePlayerStore()
    player.load(2)
    player.seek(9999)
    expect(player.position).toBe(player.duration)
    expect(player.remaining).toBe(0)
    player.skip(-15)
    expect(player.remaining).toBeGreaterThanOrEqual(15) // snaps back to the start of a line
    player.load(3)
    expect(player.position).toBe(0)
    expect(player.playing).toBe(false)
  })

  it('advances the clock while playing and stops when paused (no speech API in tests)', () => {
    vi.useFakeTimers()
    const player = usePlayerStore()
    player.load(2)
    player.play()
    expect(player.voiceStatus).toBe('unsupported')
    vi.advanceTimersByTime(3000)
    expect(player.position).toBeCloseTo(3, 0)
    player.pause()
    const pausedAt = player.position
    vi.advanceTimersByTime(3000)
    expect(player.position).toBe(pausedAt)
    vi.useRealTimers()
  })

  it('has a narration script for every site, in every language', async () => {
    const { SITES } = await import('@/data/sites')
    const { LOCALES } = await import('@/i18n')
    const { localizeNarration } = await import('@/i18n/content')
    for (const site of SITES) {
      for (const { code } of LOCALES) {
        const narration = localizeNarration(site.id, code)
        expect(narration.title.length).toBeGreaterThan(0)
        expect(narration.transcript.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
