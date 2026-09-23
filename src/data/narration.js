/**
 * Audio-tour chapters keyed by site id. Sites without a dedicated chapter
 * fall back to a generic one (see getNarration).
 */
const CHAPTERS = {
  1: {
    title: 'Life in South Hobart in the 1840s',
    chapter: 1,
    chapterCount: 4,
    durationSeconds: 165,
    transcript: [
      'In the 1840s, the Cascade Female Factory sat in a damp valley below kunanyi / Mount Wellington.',
      'Women arriving from Britain were assessed, classed and assigned work — laundry, sewing or picking oakum.',
      'Children often lived with their mothers inside the walls until they were weaned.',
      'Today, the surviving yards help us remember the lives and resilience of these women.',
    ],
  },
}

export const NARRATION_LANGUAGES = ['EN', '中文', '日本語']

/**
 * @param {{id:number, shortName:string, name:string}} site
 */
export function getNarration(site) {
  return (
    CHAPTERS[site.id] ?? {
      title: `Stories of ${site.shortName}`,
      chapter: 1,
      chapterCount: 3,
      durationSeconds: 140,
      transcript: [
        `Welcome to ${site.name}.`,
        'Take a moment to look at the sandstone — much of it was quarried and shaped by convict labour.',
        'As you walk, notice how the building has been adapted across two centuries of city life.',
      ],
    }
  )
}
