/**
 * "Through time" on the AR screen (pure — unit-tested in tests/lib/timeline.spec.js).
 * `position` is a float along the timeline: 0 = today … last = the oldest photo; in between,
 * two neighbouring photos are blended. Playback moves it at a constant speed, so the progress bar
 * and the photos age evenly — nothing jumps.
 */

/** Seconds from one photo to the next during playback (constant speed). */
export const SECONDS_PER_PHOTO = 6

/** Advance by `dtMs`, never past the oldest photo. */
export function advancePosition(position, dtMs, last, secondsPerPhoto = SECONDS_PER_PHOTO) {
  return Math.min(last, Math.max(0, position + dtMs / 1000 / secondsPerPhoto))
}

/** The lower photo of the pair stays opaque; the next one (older) fades in over it. */
export function layerOpacity(index, position) {
  const lower = Math.floor(position)
  if (index === lower) return 1
  if (index === lower + 1) return position - lower
  return 0
}

/**
 * AR timeline entries: "today" is the live camera view (keeping today's caption), then the
 * site's photos from newest to oldest.
 * @param {object[]} timeline siteTimeline(site) — newest first; entry 0 is today
 * @param {string} liveImage the camera-view image
 */
export function arTimeline(timeline, liveImage) {
  if (!timeline.length) return [{ image: liveImage, year: null, title: '', text: '', archival: false }]
  const [today, ...older] = timeline
  return today.year == null ? [{ ...today, image: liveImage }, ...older] : [{ ...today, image: liveImage, year: null }, ...timeline]
}
