/**
 * Heritage site catalogue.
 * To add a site: append an object below — every screen (Home, detail,
 * gallery, map, navigation) reads from this list, nothing else needs editing.
 *
 * @typedef {Object} GalleryPhoto
 * @property {string} image
 * @property {string} caption
 * @property {string} year
 * @property {string} description
 *
 * @typedef {Object} HeritageSite
 * @property {number} id
 * @property {string} name
 * @property {string} shortName     Used where space is tight (map labels, rank cards)
 * @property {string} category      Key from data/categories.js
 * @property {string} categoryLabel
 * @property {string} area
 * @property {string} builtYear
 * @property {{lat:number,lng:number}} coordinates  Real WGS84 position (OpenStreetMap)
 * @property {number} walkMinutes   Derived: estimated walking time from the default origin (Centenary Building)
 * @property {number} distanceKm    Derived: straight-line km from the default origin
 * @property {boolean} accessible
 * @property {number} baseLikes     Seed like count before the user's own like
 * @property {string} image
 * @property {string} description
 * @property {{x:number,y:number}} mapPosition  Derived: position on the illustrated fallback map (%)
 * @property {GalleryPhoto[]} gallery
 * @property {string} arImage       Simulated AR camera feed when the site is detected
 * @property {string} arApproachImage  Simulated AR-navigation camera feed while walking to it
 * @property {Object} [timeTravel]  AR "then vs now" content (sites with archival imagery)
 */

import { DEFAULT_ORIGIN } from './navigation'
import { boundsOf, distanceKm, projectToBox, roundKm, walkingMinutes } from '@/lib/geo'

const IMAGE_BASE = 'https://ginaintas-art.github.io/hobart-heritage-ar-prototype/images/landmarks/'

/** @param {string} file */
export const landmarkImage = (file) => `${IMAGE_BASE}${file}`

const photo = (file, caption, year, description) => ({
  image: landmarkImage(file),
  caption,
  year,
  description,
})

/** @type {HeritageSite[]} Raw entries; derived fields are added below. */
const CATALOGUE = [
  {
    id: 1,
    name: 'Cascade Female Factory',
    shortName: 'Cascade',
    category: 'convict',
    categoryLabel: 'Convict Heritage',
    area: 'South Hobart',
    builtYear: '1828',
    coordinates: { lat: -42.89382, lng: 147.29926 },
    accessible: true,
    baseLikes: 248,
    image: landmarkImage('cascade-main.webp'),
    arImage: landmarkImage('cascade-main.webp'),
    arApproachImage: landmarkImage('cascade-gallery-1.webp'),
    description:
      "One of Australia's most significant convict heritage sites. This sandstone complex held female convicts and their children in the colonial era, and its preserved yards tell stories of resilience, labour and survival.",
    gallery: [
      photo('cascade-gallery-1.webp', 'World Heritage entrance', 'Present day', 'The entrance to the historic precinct.'),
      photo('cascade-gallery-2.webp', 'Factory yard panorama', 'Present day', 'Looking across the surviving sandstone yards.'),
      photo('cascade-gallery-3.webp', 'Cascades factory yard', 'Present day', 'Inside one of the preserved yards.'),
      photo('cascade-gallery-4.webp', 'Historic factory precinct', '1892', 'An archival view of the site in the late 19th century.'),
    ],
    timeTravel: {
      pastYear: '1844',
      pastImage: landmarkImage('cascade-ar-1844.webp'),
      presentImage: landmarkImage('cascade-ar-today-alt.webp'),
      pastCaption:
        'High stone walls enclosed crowded yards where women worked and lived under strict supervision.',
      presentCaption:
        'Only parts of the walls survive. The open yards are now a World Heritage-listed place of remembrance.',
    },
  },
  {
    id: 2,
    name: "St George's Church",
    shortName: "St George's",
    category: 'religious',
    categoryLabel: 'Religious Heritage',
    area: 'Battery Point',
    builtYear: '1842',
    coordinates: { lat: -42.89152, lng: 147.3321 },
    accessible: false,
    baseLikes: 196,
    image: landmarkImage('st-georges-main.webp'),
    arImage: landmarkImage('st-georges-main.webp'),
    arApproachImage: landmarkImage('st-georges-gallery-2.webp'),
    description:
      'A fine example of Georgian church architecture. Its sandstone façade and tower have overlooked Battery Point for almost two centuries, and it is still an active place of worship.',
    gallery: [
      photo('st-georges-gallery-1.webp', "St George's Church", '2013', 'The tower and sandstone façade.'),
      photo('st-georges-gallery-2.webp', 'From Battery Point', '2022', 'The church within the Battery Point streetscape.'),
      photo('st-georges-gallery-3.webp', 'Church steeple', '2013', 'The steeple visible above the suburb.'),
      photo('st-georges-gallery-4.webp', 'Church and grounds', '2015', 'The church and its historic grounds.'),
    ],
  },
  {
    id: 3,
    name: 'Salamanca Place',
    shortName: 'Salamanca',
    category: 'waterfront',
    categoryLabel: 'Colonial Commerce',
    area: 'Waterfront',
    builtYear: '1835–1860',
    coordinates: { lat: -42.88716, lng: 147.3369 },
    accessible: true,
    baseLikes: 181,
    image: landmarkImage('salamanca-main.webp'),
    arImage: landmarkImage('salamanca-main.webp'),
    arApproachImage: landmarkImage('salamanca-gallery-1.webp'),
    description:
      'Rows of sandstone warehouses that once stored whaling and trading goods. Today the precinct hosts markets, galleries and restaurants while keeping its colonial character.',
    gallery: [
      photo('salamanca-gallery-1.webp', 'Salamanca streetscape', '2008', 'The row of convict-built warehouses.'),
      photo('salamanca-gallery-2.webp', 'Salamanca Market', '2007', 'Market stalls along the warehouses.'),
      photo('salamanca-gallery-3.webp', 'Waterfront warehouses', '2005–2006', 'Restored warehouse façades.'),
      photo('salamanca-gallery-4.webp', 'Salamanca precinct', '2007', 'The precinct near the waterfront.'),
    ],
  },
  {
    id: 4,
    name: 'Penitentiary Chapel',
    shortName: 'Penitentiary',
    category: 'convict',
    categoryLabel: 'Convict Heritage',
    area: 'CBD',
    builtYear: '1831',
    coordinates: { lat: -42.87732, lng: 147.32753 },
    accessible: false,
    baseLikes: 143,
    image: landmarkImage('penitentiary-main.webp'),
    arImage: landmarkImage('penitentiary-main.webp'),
    arApproachImage: landmarkImage('penitentiary-gallery-1.webp'),
    description:
      "A complex of sandstone buildings — chapel, cells and courts — linked by underground tunnels. One of Hobart's most atmospheric heritage experiences.",
    gallery: [
      photo('penitentiary-gallery-1.webp', 'Chapel exterior', '2017', 'The surviving chapel complex.'),
      photo('penitentiary-gallery-2.webp', 'Old Trinity and Penitentiary', 'c.1900', 'An archival view of the precinct.'),
      photo('penitentiary-gallery-3.webp', 'South courtyard', '2026', 'Inside the penitentiary site.'),
      photo('penitentiary-gallery-4.webp', 'Chapel tower', '2017', 'The tower and its historic clock.'),
    ],
    timeTravel: {
      pastYear: 'c.1900',
      pastImage: landmarkImage('penitentiary-gallery-2.webp'),
      presentImage: landmarkImage('penitentiary-main.webp'),
      pastCaption:
        'Around 1900 the chapel still stood beside a working gaol, its tower and clock rising over Campbell Street.',
      presentCaption:
        'Today the chapel, cells and courtrooms are a historic site, with tours through the tunnels below.',
    },
  },
  {
    id: 5,
    name: 'Narryna Heritage Museum',
    shortName: 'Narryna',
    category: 'colonial',
    categoryLabel: 'Colonial Living',
    area: 'Battery Point',
    builtYear: '1836',
    coordinates: { lat: -42.88929, lng: 147.33155 },
    accessible: true,
    baseLikes: 126,
    image: landmarkImage('narryna-main.webp'),
    arImage: landmarkImage('narryna-main.webp'),
    arApproachImage: landmarkImage('narryna-gallery-3.webp'),
    description:
      "One of Australia's oldest and most complete colonial merchant houses, with a collection that gives an intimate picture of life in early Van Diemen's Land.",
    gallery: [
      photo('narryna-gallery-1.webp', "Narryna merchant's house", 'Present day', 'The Georgian façade and fountain.'),
      photo('narryna-gallery-2.webp', 'Narryna courtyard', '2015', 'The working courtyard.'),
      photo('narryna-gallery-3.webp', 'Façade and fountain', 'Present day', 'The formal entrance and carriage loop.'),
      photo('narryna-gallery-4.webp', 'Façade detail', 'Present day', 'Architectural detail of the façade.'),
    ],
  },
]

/**
 * Area of the illustrated fallback map (percent of the canvas) where pins may sit:
 * the lower part is covered by the map's bottom panel.
 */
export const FALLBACK_MAP_BOX = { x: [10, 86], y: [9, 40] }
export const SITE_BOUNDS = boundsOf(CATALOGUE.map((s) => s.coordinates), 0.08)

/** @type {HeritageSite[]} */
export const SITES = CATALOGUE.map((site) => {
  const km = distanceKm(DEFAULT_ORIGIN, site.coordinates)
  return {
    ...site,
    distanceKm: roundKm(km),
    walkMinutes: walkingMinutes(km),
    mapPosition: projectToBox(site.coordinates, SITE_BOUNDS, FALLBACK_MAP_BOX),
  }
})



/**
 * @param {number|string} id
 * @returns {HeritageSite|undefined}
 */
export function getSiteById(id) {
  return SITES.find((site) => site.id === Number(id))
}
