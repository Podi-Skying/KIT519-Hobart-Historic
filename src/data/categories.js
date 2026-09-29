/**
 * Home filter chips and map pin glyphs. `key` must match `site.category` (except "all");
 * `icon` (from assets/icons) marks the site's pin, so the map reads by kind of place, not number.
 */
export const ALL_CATEGORIES = 'all'

export const CATEGORIES = [
  { key: ALL_CATEGORIES, label: 'All' },
  { key: 'convict', label: 'Convict', icon: 'lock' },
  { key: 'religious', label: 'Religious', icon: 'church' },
  { key: 'colonial', label: 'Colonial', icon: 'cottage' },
  { key: 'civic', label: 'Civic', icon: 'house' },
  { key: 'military', label: 'Military', icon: 'flag' },
  { key: 'waterfront', label: 'Waterfront', icon: 'anchor' },
]

/** Pin glyph for a category key (a neutral pin for anything unknown). */
export const categoryIcon = (key) => CATEGORIES.find((c) => c.key === key)?.icon ?? 'pin'
