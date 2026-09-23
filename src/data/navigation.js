/**
 * Walking-route presets. `factor` scales a site's normal walking time.
 * `color` is a CSS token for DOM/SVG; `hex` is the same colour for Google Maps
 * (which can't read CSS variables) — keep them in sync with tokens.css.
 */
export const ROUTE_TYPES = [
  { key: 'normal', label: 'Normal', factor: 1, color: 'var(--brand-600)', hex: '#7D3045', dashed: true },
  { key: 'accessible', label: 'Accessible', factor: 1.75, color: 'var(--success-600)', hex: '#4A6741', dashed: false },
  { key: 'steep', label: 'Steep', factor: 0.65, color: 'var(--accent-500)', hex: '#D98A3D', dashed: true },
]

export const DEFAULT_ROUTE_TYPE = 'normal'

/** Optional stops a walker can add to a route. */
export const WAYPOINTS = [
  { id: 'toilets', label: 'Toilets', detourMinutes: 2, icon: 'toilet' },
  { id: 'coffee', label: 'Coffee', detourMinutes: 4, icon: 'coffee' },
  { id: 'library', label: 'Library', detourMinutes: 8, icon: 'book' },
  { id: 'salamanca', label: 'Salamanca', detourMinutes: 7, icon: 'anchor' },
  { id: 'st-georges', label: "St George's", detourMinutes: 3, icon: 'church' },
  { id: 'narryna', label: 'Narryna', detourMinutes: 6, icon: 'house' },
]

export const MAX_STOPS = 4

/**
 * Reference point for distances when the walker's real location is unknown,
 * denied, or outside Hobart: Franklin Square, the centre of the CBD.
 */
export const HOBART_CENTRE = { lat: -42.88338, lng: 147.3303 }

/** Beyond this distance from the centre the walker is treated as "not in Hobart". */
export const HOBART_RADIUS_KM = 25

/** The three ways to follow a route (Navigate › choose mode). */
export const NAVIGATION_MODES = [
  {
    route: 'navigate-map',
    title: 'Standard map',
    description: 'Top-down route with turn-by-turn directions.',
    tag: 'Battery-friendly',
    icon: 'map',
  },
  {
    route: 'navigate-ar',
    title: 'AR navigation',
    description: 'Arrows over the live camera view of the street.',
    tag: 'Immersive',
    icon: 'ar',
  },
  {
    route: 'navigate-print',
    title: 'Printable map',
    description: 'Route, stops and space for notes on paper.',
    tag: 'Works offline',
    icon: 'print',
  },
]
