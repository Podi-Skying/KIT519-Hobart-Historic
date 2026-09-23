/**
 * Audio-tour scripts (English source), keyed by site id.
 * Translations: src/i18n/content/<locale>.js › narration.<id>.
 * Spoken aloud with the device's text-to-speech voice for the current language.
 */
export const NARRATION = {
  1: {
    title: 'Life in South Hobart in the 1840s',
    chapter: 1,
    chapterCount: 4,
    transcript: [
      'In the 1840s, the Cascade Female Factory sat in a damp valley below kunanyi / Mount Wellington.',
      'Women arriving from Britain were assessed, classed and assigned work — laundry, sewing or picking oakum.',
      'Children often lived with their mothers inside the walls until they were weaned.',
      'Today, the surviving yards help us remember the lives and resilience of these women.',
    ],
  },
  2: {
    title: 'A landmark on the hill',
    chapter: 1,
    chapterCount: 3,
    transcript: [
      'St George’s Church has watched over Battery Point since the colony’s early decades, when this was a village of sailors, shipwrights and merchants.',
      'Its sandstone was cut from local quarries, and its tall tower became a landmark seen from the river.',
      'Look up at the columns of the façade — a classical style that signalled confidence in the young colony.',
      'The church is still a working parish, so please be respectful if a service is under way.',
    ],
  },
  3: {
    title: 'Warehouses of the whaling port',
    chapter: 1,
    chapterCount: 3,
    transcript: [
      'In the 1830s this waterfront was the busiest place in Hobart Town, lined with sandstone warehouses built by convict labour.',
      'Whale oil, wool, grain and timber passed through these doors on their way to London and beyond.',
      'The street takes its name from the 1812 Battle of Salamanca, fought in Spain during the Napoleonic Wars.',
      'Today the same buildings hold galleries, cafés and the famous Saturday market.',
    ],
  },
  4: {
    title: 'Behind the chapel walls',
    chapter: 1,
    chapterCount: 3,
    transcript: [
      'This chapel was built in the early 1830s for the convicts held in the prisoners’ barracks next door.',
      'Men were marched in for compulsory services, seated in tiered pews and watched closely by guards.',
      'Beneath your feet run tunnels that once linked the chapel to cells and, later, to the criminal courts.',
      'Prayer was meant to reform — but for many men it was simply another form of control.',
    ],
  },
  5: {
    title: 'A merchant’s home in Van Diemen’s Land',
    chapter: 1,
    chapterCount: 3,
    transcript: [
      'Narryna was built in the late 1830s as the home of a sea captain and merchant, close to the busy wharves.',
      'Its elegant sandstone front hid a practical household of servants, kitchens and a working courtyard.',
      'Today it is a museum, furnished with the everyday objects of colonial family life.',
      'As you step inside, notice how comfort and status were shown through furniture, china and portraits.',
    ],
  },
}

/** Rough speaking speed used to estimate durations (characters per second). */
const CHARS_PER_SECOND = { cjk: 5.5, default: 14 }

/** Estimated seconds to speak a line (CJK scripts are read by character, others by letters). */
export function estimateSeconds(line) {
  const cjk = (line.match(/[぀-ヿ㐀-鿿가-힯]/g) ?? []).length
  const other = line.length - cjk
  return Math.max(2, Math.round(cjk / CHARS_PER_SECOND.cjk + other / CHARS_PER_SECOND.default))
}
