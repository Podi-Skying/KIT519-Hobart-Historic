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
 * @property {{title:string, url:string, thr?:number, publisher?:string}[]} sources  Official sources for the description
 *
 * @typedef {Object} HeritageSite
 * @property {number} id
 * @property {number} [thr]         Tasmanian Heritage Register ID (onlineregister.heritage.tas.gov.au/Place/<thr>)
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

const photo = (file, caption, year, description, credit) => ({
  image: landmarkImage(file),
  caption,
  year,
  description,
  ...(credit && { credit }),
})

/**
 * Openly licensed photo hot-linked from Wikimedia Commons or Flickr (never re-hosted), with the
 * attribution its licence requires — shown under the photo in the gallery (GalleryView).
 * `detail`: interiors and close-ups; the AR "through time" playback leaves them out.
 */
const openPhoto = (image, caption, year, description, credit, { detail = false } = {}) => ({
  image,
  thumb: smallVersion(image),
  caption,
  year,
  description,
  credit,
  ...(detail && { detail }),
})
/**
 * A catalogue site with one openly licensed photo: it is the hero, the AR views and the gallery.
 * (The five tour sites above carry full galleries, time-travel imagery and scripted narration.)
 */
const singlePhoto = (image, caption, year, description, photoCredit) => ({
  image,
  arImage: image,
  arApproachImage: image,
  gallery: [openPhoto(image, caption, year, description, photoCredit)],
})
/**
 * Where a site's facts come from, listed under its description (SiteDetailView). Prefer official
 * Tasmanian sources: the Heritage Register entry first (its datasheet holds the history), then
 * the site's own custodian. Every fact in a description must be traceable to one of these.
 */
const thrEntry = (id, title) => ({ thr: id, title, url: `https://onlineregister.heritage.tas.gov.au/Place/${id}` })
const webSource = (publisher, title, url) => ({ publisher, title, url })
/**
 * A ~330px version for thumbnails and photo rails (both hosts serve resized copies by URL):
 * Commons `…/1280px-x.jpg` or an original → `…/thumb/…/330px-x.jpg` (Commons only serves standard widths); Flickr `_b` (1024) → `_n` (320).
 */
export function smallVersion(url) {
  if (url.includes('/thumb/')) return url.replace(/\/\d+px-/, '/330px-')
  const commons = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/)(\w\/\w\w\/)([^/]+)$/.exec(url)
  if (commons) return `${commons[1]}thumb/${commons[2]}${commons[3]}/330px-${commons[3]}`
  return url.replace(/_[bcz]\.jpg$/, '_n.jpg').replace(/_(\w{10})\.jpg$/, '_$1_n.jpg')
}
/** @param {string} author @param {string} license @param {string} url  source page */
const credit = (author, license, url) => ({ author, license, url, licenseUrl: LICENSE_URLS[license] ?? null })
const LICENSE_URLS = {
  'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 2.5': 'https://creativecommons.org/licenses/by-sa/2.5/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY-ND 2.0': 'https://creativecommons.org/licenses/by-nd/2.0/',
  'CC BY-NC 2.0': 'https://creativecommons.org/licenses/by-nc/2.0/',
  'CC BY-NC-SA 2.0': 'https://creativecommons.org/licenses/by-nc-sa/2.0/'
}

/** @type {HeritageSite[]} Raw entries; derived fields are added below. */
const CATALOGUE = [
  {
    id: 1,
    thr: 10851,
    name: 'Cascades Female Factory',
    shortName: 'Cascades',
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
    sources: [
      thrEntry(10851, 'Cascades Female Factory'),
      webSource('Cascades Female Factory Historic Site', 'Cascades Female Factory', 'https://www.femalefactory.org.au/'),
    ],
    gallery: [
      photo('cascade-gallery-1.webp', 'World Heritage entrance', 'Present day', 'The entrance to the historic precinct.'),
      photo('cascade-gallery-2.webp', 'Factory yard panorama', 'Present day', 'Looking across the surviving sandstone yards.'),
      photo('cascade-gallery-3.webp', 'Cascades factory yard', 'Present day', 'Inside one of the preserved yards.'),
      photo('cascade-gallery-4.webp', 'Historic factory precinct', '1892', 'An archival view of the site in the late 19th century.', credit('James Walker', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Cascades_Female_Factory,_1892.png')),
      openPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/3/30/CascadesWomens.jpg',
        'Early 20th-century view',
        '1914–1941',
        'The factory buildings photographed by Beattie Studios, Hobart.',
        credit('Beattie Studios, Hobart', 'Public domain', 'https://commons.wikimedia.org/wiki/File:CascadesWomens.jpg'),
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Cascades_Female_Factory.jpg/1280px-Cascades_Female_Factory.jpg',
        'Factory walls',
        '2009',
        'The high sandstone walls that closed the women in.',
        credit('Barrylb', 'CC0', 'https://commons.wikimedia.org/wiki/File:Cascades_Female_Factory.jpg'),
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Cottage_in_Cascades_Female_Factory_02.JPG/1280px-Cottage_in_Cascades_Female_Factory_02.JPG',
        'Cottage in the grounds',
        '2013',
        'A cottage inside the factory grounds.',
        credit('Azoma', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Cottage_in_Cascades_Female_Factory_02.JPG'),
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Cascades_Female_Factory_entrance.JPG/1280px-Cascades_Female_Factory_entrance.JPG',
        'Visitor entrance',
        '2013',
        'Where visitors enter the site today.',
        credit('Azoma', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Cascades_Female_Factory_entrance.JPG'),
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Yard_4_washing_lines%2C_Female_Factory.jpg/1280px-Yard_4_washing_lines%2C_Female_Factory.jpg',
        'Yard 4 washing lines',
        '2013',
        'Washing lines recall the laundry work the women did here.',
        credit('Philarazzi', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Yard_4_washing_lines,_Female_Factory.jpg'),
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/From_the_Shadows_statue_out_front_of_Cascades_Female_Factory.jpg/1280px-From_the_Shadows_statue_out_front_of_Cascades_Female_Factory.jpg',
        'From the Shadows',
        '2024',
        'A memorial statue to the women and children held here.',
        credit('Shkuru Afshar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:From_the_Shadows_statue_out_front_of_Cascades_Female_Factory.jpg'),
        { detail: true },
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Cascades_Female_Factory-Degraves_Street_view.jpg/1280px-Cascades_Female_Factory-Degraves_Street_view.jpg',
        'From Degraves Street',
        '2024',
        'The factory walls seen from the street.',
        credit('Shkuru Afshar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Cascades_Female_Factory-Degraves_Street_view.jpg'),
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Cascades_Female_Factory-Middle_yard.jpg/1280px-Cascades_Female_Factory-Middle_yard.jpg',
        'Middle yard',
        '2024',
        'The open middle yard today.',
        credit('Shkuru Afshar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Cascades_Female_Factory-Middle_yard.jpg'),
      ),
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
    builtYear: '1838', // consecrated 26 May 1838; tower 1841–47, portico 1888 (stgeorgesbatterypoint.org)
    coordinates: { lat: -42.89148, lng: 147.33217 }, // 30 Cromwell St, Battery Point (street address: Street View stands here)
    accessible: true, // ramp and accessible stairs added 2017
    baseLikes: 196,
    image: landmarkImage('st-georges-main.webp'),
    arImage: landmarkImage('st-georges-main.webp'),
    arApproachImage: landmarkImage('st-georges-gallery-2.webp'),
    description:
      "Designed by John Lee Archer, this sandstone church was built in 1836–38 in the Old Colonial Grecian style, and James Blackburn's tower was added in 1847. It has overlooked Battery Point for almost two centuries, and it is still an active place of worship.",
    sources: [
      thrEntry(1688, "St George's Church and Schoolhouse"),
      webSource("St George's Battery Point", "St George's Anglican Church", 'https://stgeorgesbatterypoint.org/'),
    ],
    gallery: [
      photo('st-georges-gallery-1.webp', "St George's Church", '2013', 'The tower and sandstone façade.', credit('Annette Teng', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Hobart_Convict_Era_Church_-_panoramio.jpg')),
      photo('st-georges-gallery-2.webp', 'From Battery Point', '2022', 'The church within the Battery Point streetscape.', credit('Paris Buttfield-Addison', 'CC BY 2.0', "https://commons.wikimedia.org/wiki/File:DSC00110_St_George's_2022.jpg")),
      photo('st-georges-gallery-3.webp', 'Church steeple', '2013', 'The steeple visible above the suburb.', credit('Richard Horvath', 'CC BY-SA 3.0', "https://commons.wikimedia.org/wiki/File:St_George's_Anglican_church_steeple,_Battery_Point_-_panoramio.jpg")),
      photo('st-georges-gallery-4.webp', 'Church and grounds', '2015', 'The church and its historic grounds.', credit('Tatyana Kozlova', 'CC BY 2.0', "https://commons.wikimedia.org/wiki/File:St_George's_Battery_Pt_2015.jpg")),
      openPhoto(
        'https://live.staticflickr.com/5475/10375580395_f235b922be_b.jpg',
        'Church, tower and porch',
        '2010',
        'The church of 1838, with the tower added in 1847 and the porch in 1888.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10375580395'),
      ),
      openPhoto(
        'https://live.staticflickr.com/3784/10375545364_d59b53a7e5_b.jpg',
        'Georgian entrance',
        '2010',
        'The columned entrance porch, added in 1888.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10375545364'),
      ),
      openPhoto(
        'https://live.staticflickr.com/7322/10375596395_17d464b073_b.jpg',
        'Memorial beside the church',
        '2010',
        'A memorial along the side wall of the church.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10375596395'),
        { detail: true },
      ),
      openPhoto(
        'https://live.staticflickr.com/7370/10375456433_9a74c96736_b.jpg',
        'Inside the church',
        '2010',
        'Pews, pulpit and pipe organ in the nave.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10375456433'),
        { detail: true },
      ),
      openPhoto(
        'https://live.staticflickr.com/5514/11184289963_9316b1844f_b.jpg',
        'Painted glass window',
        '2011',
        'One of the church’s painted glass windows.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/11184289963'),
        { detail: true },
      ),
      openPhoto(
        'https://live.staticflickr.com/5296/5531859410_e454d7bc47_b.jpg',
        'Tower at night',
        '2011',
        'The floodlit tower above Battery Point after dark.',
        credit('BaboMike', 'CC BY-NC 2.0', 'https://www.flickr.com/photos/36976184@N02/5531859410'),
      ),
      openPhoto(
        'https://live.staticflickr.com/2893/10377500943_381b20e2a5_b.jpg',
        'Side windows',
        'Present day',
        'Trapezoid-headed windows of the 1830s; the porch window came in 1888.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10377500943'),
        { detail: true },
      ),
    ],
  },
  {
    id: 3,
    name: 'Salamanca Place',
    shortName: 'Salamanca',
    category: 'waterfront',
    categoryLabel: 'Colonial Commerce',
    area: 'Waterfront',
    builtYear: '1830s–1840s', // warehouses begun c.1830, most finished by the 1840s
    coordinates: { lat: -42.88696, lng: 147.33244 }, // 45 Salamanca Pl
    accessible: true,
    baseLikes: 181,
    image: landmarkImage('salamanca-main.webp'),
    arImage: landmarkImage('salamanca-main.webp'),
    arApproachImage: landmarkImage('salamanca-gallery-1.webp'),
    description:
      'Rows of sandstone warehouses that once stored whaling and trading goods. Today the precinct hosts markets, galleries and restaurants while keeping its colonial character.',
    sources: [
      thrEntry(12029, 'Former warehouses, 31–35 Salamanca Place'),
      thrEntry(1944, 'Salamanca Arts Centre'),
      webSource('City of Hobart', 'Salamanca Market', 'https://www.salamancamarket.com.au/Home'),
    ],
    gallery: [
      photo('salamanca-gallery-1.webp', 'Salamanca streetscape', '2008', 'The row of convict-built warehouses.', credit('Adam Selwood', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:SalamancaPlace2008.jpg')),
      photo('salamanca-gallery-2.webp', 'Warehouse corner', '2007', 'Sandstone warehouses on a quiet weekday.', credit('Synyan', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Salamanca_market_in_Hobart.JPG')),
      photo('salamanca-gallery-3.webp', 'Waterfront warehouses', '2005–2006', 'Restored warehouse façades.', credit('Didier B (Sam67fr)', 'CC BY-SA 2.5', 'https://commons.wikimedia.org/wiki/File:Salamanca_Place_-_Hobart.jpg')),
      photo('salamanca-gallery-4.webp', 'Salamanca precinct', '2007', 'The precinct near the waterfront.'),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Princes_Wharf%2C_Hobart_%28c1900%29_%2811229291864%29.jpg/1280px-Princes_Wharf%2C_Hobart_%28c1900%29_%2811229291864%29.jpg',
        'Princes Wharf',
        'c.1900',
        'Sailing ships moored on the waterfront by the warehouses.',
        credit('Tasmanian Archive and Heritage Office', 'No known copyright restrictions', 'https://commons.wikimedia.org/wiki/File:Princes_Wharf,_Hobart_(c1900)_(11229291864).jpg'),
      ),
      openPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/7/7e/Salamanca-Market-2008.jpg',
        'Saturday market',
        '2008',
        'Market day in front of the warehouses.',
        credit('Kham Tran', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Salamanca-Market-2008.jpg'),
      ),
      openPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/8/89/Alley_off_Salamanca_Place%2C_Hobart%2C_Tasmania_-_panoramio.jpg',
        'Lane between warehouses',
        '2010',
        'A narrow lane between the sandstone buildings.',
        credit('gekko', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Alley_off_Salamanca_Place,_Hobart,_Tasmania_-_panoramio.jpg'),
        { detail: true },
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Hobart_Tasmania_Salamanca_Place.jpg/1280px-Hobart_Tasmania_Salamanca_Place.jpg',
        'Under kunanyi',
        '2011',
        'The warehouses with kunanyi / Mount Wellington behind.',
        credit('Cheng Fei', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Hobart_Tasmania_Salamanca_Place.jpg'),
      ),
      openPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/Salamanca_Place%2C_Hobart_-_panoramio.jpg',
        'Warehouse row',
        '2013',
        'The long row of warehouse fronts.',
        credit('Richard Horvath', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Salamanca_Place,_Hobart_-_panoramio.jpg'),
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/TasTrip_%2867%29_Salamanca_Square_2012.jpg/1280px-TasTrip_%2867%29_Salamanca_Square_2012.jpg',
        'Salamanca Square',
        '2012',
        'The courtyard square behind the warehouses.',
        credit('Owen Allen', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:TasTrip_(67)_Salamanca_Square_2012.jpg'),
        { detail: true },
      ),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/Salamanca_Place_-_IMG_4529.jpg/1280px-Salamanca_Place_-_IMG_4529.jpg',
        'Morning on Salamanca Place',
        '2015',
        'The street early in the day.',
        credit('Tatyana Kozlova', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Salamanca_Place_-_IMG_4529.jpg'),
      ),
      openPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/b/bf/Restaurants_at_Salamanca_Place.jpg',
        'Cafés and restaurants',
        '2024',
        'Old warehouses now full of cafés and restaurants.',
        credit('Lautreca11', 'CC0', 'https://commons.wikimedia.org/wiki/File:Restaurants_at_Salamanca_Place.jpg'),
      ),
    ],
  },
  {
    id: 4,
    thr: 12092,
    name: 'Penitentiary Chapel',
    shortName: 'Penitentiary',
    category: 'convict',
    categoryLabel: 'Convict Heritage',
    area: 'CBD',
    builtYear: '1831–1834', // Tasmanian Heritage Register THR12092
    coordinates: { lat: -42.87712, lng: 147.32661 }, // 10 Brisbane St, Hobart (street address: Street View stands here)
    accessible: false,
    baseLikes: 143,
    image: landmarkImage('penitentiary-main.webp'),
    arImage: landmarkImage('penitentiary-main.webp'),
    arApproachImage: landmarkImage('penitentiary-gallery-1.webp'),
    description:
      "A chapel built in 1831–34 to John Lee Archer's design, with 36 solitary cells beneath its raked floor. In 1859–60 part of the chapel became the Supreme Criminal Courts, which sat here until 1983. Today the National Trust leads tours through the chapel, courts and cells.",
    sources: [
      thrEntry(12092, 'Penitentiary Chapel and Criminal Courts Complex'),
      webSource('National Trust Tasmania', 'Unshackled: Hobart Penitentiary', 'https://www.nationaltrust.org.au/places/penitentiary/'),
    ],
    gallery: [
      photo('penitentiary-gallery-1.webp', 'Chapel exterior', '2017', 'The surviving chapel complex.'),
      photo('penitentiary-gallery-2.webp', 'Old Trinity and Penitentiary', 'c.1900', 'An archival view of the precinct.', credit('Tasmanian Archive and Heritage Office', 'No known copyright restrictions', 'https://commons.wikimedia.org/wiki/File:Hobart,_Old_Trinity_and_Penitentiary_from_the_Domain_(c1900)_(11229289114).jpg')),
      photo('penitentiary-gallery-3.webp', 'South courtyard', '2026', 'Inside the penitentiary site.', credit('Shkuru Afshar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Scrap_metal_sculpture_in_Hobart_Convict_Penitentiary_south_courtyard.jpg')),
      photo('penitentiary-gallery-4.webp', 'Chapel tower', '2017', 'The tower and its historic clock.'),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/View_of_Hobart_and_the_Campbell_Street_Gaol_%281860%29.jpg/1280px-View_of_Hobart_and_the_Campbell_Street_Gaol_%281860%29.jpg',
        'Campbell Street Gaol',
        'c.1860',
        'The gaol and the town seen from the Domain around 1860.',
        credit('Thomas J. Nevin and John Nevin', 'Public domain', 'https://commons.wikimedia.org/wiki/File:View_of_Hobart_and_the_Campbell_Street_Gaol_(1860).jpg'),
      ),
      openPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/a/a1/HobartGaol.jpg',
        'Gaol walls',
        '2011',
        'Surviving walls of the old Hobart Gaol.',
        credit('Sweaterandtie', 'CC0', 'https://commons.wikimedia.org/wiki/File:HobartGaol.jpg'),
      ),
      openPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/6/68/Chapel_Pen.jpg',
        'Brick chapel',
        '2011',
        'The chapel’s convict-made brick walls.',
        credit('Sweaterandtie', 'CC0', 'https://commons.wikimedia.org/wiki/File:Chapel_Pen.jpg'),
      ),
      openPhoto(
        'https://live.staticflickr.com/7371/10377502283_3b9105bb9d_b.jpg',
        'Built by convicts',
        'Present day',
        'Built by convicts to a design by John Lee Archer.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10377502283'),
      ),
      openPhoto(
        'https://live.staticflickr.com/7426/10377290834_d79d88cb81_b.jpg',
        'The tower',
        'Present day',
        'Archer’s clock tower of 1833–34.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10377290834'),
      ),
      openPhoto(
        'https://live.staticflickr.com/3759/10377290424_2588e5f0fc_b.jpg',
        'Georgian window',
        'Present day',
        'John Lee Archer’s great window — a church above, cells below.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10377290424'),
        { detail: true },
      ),
      openPhoto(
        'https://live.staticflickr.com/65535/10377309495_ee37f6d352_b.jpg',
        'Inside the chapel',
        'Present day',
        'Part of the floor is cut away to show the cells below.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/10377309495'),
        { detail: true },
      ),
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
    thr: 1771,
    name: 'Narryna Heritage Museum',
    shortName: 'Narryna',
    category: 'colonial',
    categoryLabel: 'Colonial Living',
    area: 'Battery Point',
    builtYear: '1835–1840', // narryna.com.au
    coordinates: { lat: -42.88927, lng: 147.33159 }, // 103 Hampden Rd, Battery Point
    accessible: true,
    baseLikes: 126,
    image: landmarkImage('narryna-main.webp'),
    arImage: landmarkImage('narryna-main.webp'),
    arApproachImage: landmarkImage('narryna-gallery-3.webp'),
    description:
      "A Greek Revival merchant's house built in 1835–40 for Captain Andrew Haig. In 1955 it became Australia's first folk museum, and its rooms give an intimate picture of family life in early Van Diemen's Land.",
    sources: [
      thrEntry(1771, 'Narryna Heritage Museum'),
      webSource('Narryna', 'About Narryna', 'https://www.narryna.com.au/about'),
    ],
    gallery: [
      photo('narryna-gallery-1.webp', "Narryna merchant's house", 'Present day', 'The Greek Revival façade and fountain.'),
      photo('narryna-gallery-2.webp', 'Narryna courtyard', '2015', 'The working courtyard.'),
      photo('narryna-gallery-3.webp', 'Façade and fountain', 'Present day', 'The formal entrance and carriage loop.'),
      photo('narryna-gallery-4.webp', 'Façade detail', 'Present day', 'Architectural detail of the façade.'),
      openPhoto(
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Narryna_Heritage_Museum_in_Hobart%2C_Australia.jpg/1280px-Narryna_Heritage_Museum_in_Hobart%2C_Australia.jpg',
        'Sandstone front',
        '2010',
        'The house front on Hampden Road.',
        credit('Christopher Neugebauer', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Narryna_Heritage_Museum_in_Hobart,_Australia.jpg'),
      ),
      openPhoto(
        'https://live.staticflickr.com/5298/5573567737_62ba737c58_b.jpg',
        'House and garden',
        '2004',
        'The mansion and its front garden.',
        credit('avlxyz', 'CC BY-NC-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/5573567737'),
      ),
      openPhoto(
        'https://live.staticflickr.com/3710/11994675884_a727b4dc20.jpg',
        'Brick service wing',
        '2014',
        'The brick outbuildings behind the house.',
        credit('bookgrrl99', 'CC BY-NC 2.0', 'https://www.flickr.com/photos/71082171@N00/11994675884'),
      ),
      openPhoto(
        'https://live.staticflickr.com/4473/38116611941_1137055c47_b.jpg',
        'Whale oil pot',
        '2017',
        'A whaling try-pot in the garden, from the port’s whaling trade.',
        credit('Namlhots', 'CC BY-NC-SA 2.0', 'https://www.flickr.com/photos/50907122@N00/38116611941'),
        { detail: true },
      ),
      openPhoto(
        'https://live.staticflickr.com/2808/11723204356_7582502032_b.jpg',
        'Dining room',
        '2011',
        'The dining room, furnished as in the house’s early years.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/11723204356'),
        { detail: true },
      ),
      openPhoto(
        'https://live.staticflickr.com/2862/11722437415_dd414e7c0a_b.jpg',
        'Hall and staircase',
        '2011',
        'The staircase with its newel post and Persian carpets.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/11722437415'),
        { detail: true },
      ),
      openPhoto(
        'https://live.staticflickr.com/5479/11722453835_db508f3f06_b.jpg',
        'Convict stone carving',
        '2011',
        'Carved stonework by convict masons.',
        credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/11722453835'),
        { detail: true },
      ),
    ],
  },
  {
    id: 6,
    thr: 11993,
    name: "Kelly's Steps",
    shortName: "Kelly's Steps",
    category: 'colonial',
    categoryLabel: 'Colonial Streetscape',
    area: 'Battery Point',
    builtYear: '1830s', // steps advertised by 1834; pillar dated January 1840 (THR 11993)
    coordinates: { lat: -42.88717, lng: 147.33403 }, // foot of the steps (OpenStreetMap); THR 11993
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 98,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Kelly%27s_Steps.jpg/1280px-Kelly%27s_Steps.jpg',
      "Kelly's Steps",
      '2011',
      'The stone steps climbing from Salamanca Place to Battery Point.',
      credit('Travis', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Kelly%27s_Steps.jpg'),
    ),
    description:
      'Captain James Kelly, whaler and harbour master, laid out these steps down the rocky escarpment so Battery Point residents could reach the waterfront. A flight of steps is advertised here as early as 1834, and the pillar at the top is inscribed with the street name, the date January 1840 and his initials. The steps have been a public walkway to Salamanca Place ever since.',
    sources: [
      thrEntry(11993, "Kelly's Steps"),
    ],
  },
  {
    id: 7,
    thr: 2525,
    name: 'Parliament House',
    shortName: 'Parliament',
    category: 'civic',
    categoryLabel: 'Civic Heritage',
    area: 'Waterfront',
    builtYear: '1840',
    coordinates: { lat: -42.88551, lng: 147.33042 }, // the building on Salamanca Place (OpenStreetMap); THR 2525
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 118,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Parliament_House_Hobart_Panorama.jpg/1280px-Parliament_House_Hobart_Panorama.jpg',
      'Parliament House',
      '2009',
      'The sandstone front of Parliament House across its gardens.',
      credit('Barrylb', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Parliament_House_Hobart_Panorama.jpg'),
    ),
    description:
      "Designed by colonial architect John Lee Archer, this sandstone building was built between 1830 and 1840 as the Custom House. The Legislative Council moved into its Long Room in 1841, and it has been the seat of Tasmania's Parliament ever since. The gardens in front were landscaped in 1901 for a royal visit.",
    sources: [
      thrEntry(2525, 'Parliament House and Gardens'),
    ],
  },
  {
    id: 8,
    thr: 2517,
    name: "St David's Cathedral",
    shortName: "St David's",
    category: 'religious',
    categoryLabel: 'Religious Heritage',
    area: 'CBD',
    builtYear: '1874',
    coordinates: { lat: -42.88353, lng: 147.3284 }, // 23 Murray St (OpenStreetMap); THR 2517
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 104,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Hobart_convict_era_Church_-_panoramio.jpg/1280px-Hobart_convict_era_Church_-_panoramio.jpg',
      "St David's Cathedral",
      '2013',
      'The Gothic Revival cathedral on the corner of Macquarie and Murray Streets.',
      credit('Annette Teng', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Hobart_convict_era_Church_-_panoramio.jpg'),
    ),
    description:
      'Prince Alfred laid the foundation stone in 1868, and the nave was consecrated in 1874. English architect George Frederick Bodley designed the cathedral, and the bell tower completed his plans in 1936. It is the seat of the Anglican Bishop of Tasmania.',
    sources: [
      thrEntry(2517, "St David's Cathedral"),
      webSource("St David's Cathedral", 'History', 'https://saintdavids.org.au/history/'),
    ],
  },
  {
    id: 9,
    thr: 12110,
    name: 'Theatre Royal',
    shortName: 'Theatre Royal',
    category: 'civic',
    categoryLabel: 'Performing Arts Heritage',
    area: 'CBD',
    builtYear: '1834',
    coordinates: { lat: -42.87955, lng: 147.33112 }, // 29 Campbell St (LIST address point); THR 12110
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 92,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Theatre_Royal_Hobart.jpg/1280px-Theatre_Royal_Hobart.jpg',
      'Theatre Royal',
      '2015',
      'The Victorian Classical façade on Campbell Street.',
      credit('Canley', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Theatre_Royal_Hobart.jpg'),
    ),
    description:
      'Architect John Lee Archer laid the foundation stone in 1834, and the theatre opened in 1837. It is recognised as the oldest remaining working theatre in Australia, behind a façade that dates mostly from 1857. After a fire in 1984 it was restored and reopened in 1986.',
    sources: [
      thrEntry(12110, 'Theatre Royal'),
    ],
  },
  {
    id: 10,
    thr: 11999,
    name: 'Royal Tasmanian Botanical Gardens',
    shortName: 'Botanical Gardens',
    category: 'colonial',
    categoryLabel: 'Colonial Gardens',
    area: 'Queens Domain',
    builtYear: '1818',
    coordinates: { lat: -42.86349, lng: 147.32959 }, // the gardens on Lower Domain Rd (OpenStreetMap); THR 11999
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 115,
    ...singlePhoto(
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/Hobart_Botanical_Gardens_Entrance.png',
      'Main entrance gates',
      '2007',
      'The 1878 entrance gates on Lower Domain Road.',
      credit('Barrylb', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Hobart_Botanical_Gardens_Entrance.png'),
    ),
    description:
      'Established in 1818 on the Queens Domain, these are the second-oldest botanical gardens in Australia. The convict-built Arthur Wall of 1829 still runs along the western boundary. The ornamental main gates, modelled on those at Kew, date from 1878.',
    sources: [
      thrEntry(11999, 'Royal Tasmanian Botanical Gardens'),
    ],
  },
  {
    id: 11,
    thr: 7137,
    name: 'Hobart Cenotaph',
    shortName: 'Cenotaph',
    category: 'military',
    categoryLabel: 'Military Heritage',
    area: 'Queens Domain',
    builtYear: '1925',
    coordinates: { lat: -42.87781, lng: 147.33655 }, // the memorial (OpenStreetMap); THR 7137
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 77,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Hobart_Cenotaph%2C_Tasmania%2C_Australia_-_with_wreaths_for_ANZAC_Day.jpg/1280px-Hobart_Cenotaph%2C_Tasmania%2C_Australia_-_with_wreaths_for_ANZAC_Day.jpg',
      'Wreaths on Anzac Day',
      '2012',
      'Wreaths laid at the foot of the Cenotaph on Anzac Day.',
      credit('Edoddridge', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Hobart_Cenotaph,_Tasmania,_Australia_-_with_wreaths_for_ANZAC_Day.jpg'),
    ),
    description:
      "Tasmania's main war memorial was unveiled on the Queens Domain in December 1925, directly on top of the remains of the old Queen's Battery. The granite obelisk was designed to honour Tasmanians who died in the First World War and now remembers later conflicts too. The site has held Hobart's Anzac Day and Remembrance Day services since 1919.",
    sources: [
      thrEntry(7137, "Cenotaph, Anzac Parade and Queen's Battery"),
    ],
  },
  {
    id: 12,
    thr: 1653,
    name: 'Princes Park',
    shortName: 'Princes Park',
    category: 'military',
    categoryLabel: 'Military Heritage',
    area: 'Battery Point',
    builtYear: '1818',
    coordinates: { lat: -42.88761, lng: 147.33702 }, // centre of the listed area (THR 1653, Mulgrave Battery and Signal Station)
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 58,
    ...singlePhoto(
      'https://live.staticflickr.com/4012/4333232593_b1589cbe15_b.jpg',
      'Princes Park',
      '2010',
      'Looking out over the River Derwent from the park.',
      credit('HeatherW', 'CC BY-NC 2.0', 'https://www.flickr.com/photos/53942725@N00/4333232593'),
    ),
    description:
      'The Mulgrave Battery was built on this point in 1818 to guard the river, and rebuilt in 1841–42 as the Prince of Wales Battery. The signal station here passed on news of ships approaching Hobart from Mount Nelson. The old earthworks, magazine and signal cottage now sit inside a quiet waterside park.',
    sources: [
      thrEntry(1653, 'Mulgrave Battery and Signal Station'),
    ],
  },
  {
    id: 13,
    thr: 972,
    name: 'Kangaroo Bluff Battery',
    shortName: 'Kangaroo Bluff',
    category: 'military',
    categoryLabel: 'Military Heritage',
    area: 'Bellerive',
    builtYear: '1885',
    coordinates: { lat: -42.8819, lng: 147.36718 }, // the battery on Gunning St (OpenStreetMap); THR 972
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 55,
    ...singlePhoto(
      'https://live.staticflickr.com/7150/6658642811_f627cbe362_b.jpg',
      'Gun emplacement',
      '2011',
      'One of the battery’s guns, looking across the Derwent to Hobart.',
      credit('jeffowenphotos', 'CC BY 2.0', 'https://www.flickr.com/photos/48264126@N00/6658642811'),
    ),
    description:
      'Across the river at Bellerive, this battery was begun in 1878 and completed in 1885 to defend the Derwent. It was manned during the First World War and in use until the 1920s. Its stone trenches and walls are now part of a community park looking back to Hobart.',
    sources: [
      thrEntry(972, 'Kangaroo Bluff Battery'),
      thrEntry(1653, 'Mulgrave Battery and Signal Station (Hobart defences history)'),
    ],
  },
  {
    id: 14,
    thr: 12148,
    name: 'Franklin Square',
    shortName: 'Franklin Square',
    category: 'colonial',
    categoryLabel: 'Colonial Heritage',
    area: 'CBD',
    builtYear: '1860s',
    coordinates: { lat: -42.88338, lng: 147.3303 }, // the square (OpenStreetMap); THR 12148, Franklin Square and the site of Old Government House
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 85,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Franklin_Square_Hobart_20171120-002.jpg/1280px-Franklin_Square_Hobart_20171120-002.jpg',
      'Franklin Square',
      '2017',
      'The statue of Sir John Franklin at the centre of the square.',
      credit('Gary Houston', 'CC0', 'https://commons.wikimedia.org/wiki/File:Franklin_Square_Hobart_20171120-002.jpg'),
    ),
    description:
      'Old Government House, the seat of the colonial government, stood here from 1804 until it was demolished in 1858. The site was levelled in 1863 and named after Sir John Franklin, Lieutenant-Governor from 1837 to 1843 and Arctic explorer. His statue was installed at the centre of the square in 1865.',
    sources: [
      thrEntry(12148, 'Franklin Square and the site of Old Government House'),
    ],
  },
  {
    id: 15,
    thr: 10995,
    name: 'Hobart Railway Goods Shed',
    shortName: 'Goods Shed',
    category: 'waterfront',
    categoryLabel: 'Industrial Heritage',
    area: 'Macquarie Point',
    builtYear: '1915',
    coordinates: { lat: -42.88044, lng: 147.33695 }, // centre of the listed area (THR 10995)
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 29,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Macquarie_Point_Hobart_Goods_Shed.jpg/1280px-Macquarie_Point_Hobart_Goods_Shed.jpg',
      'The Goods Shed',
      '2025',
      'The long corrugated-iron shed at Macquarie Point.',
      credit('Chuq', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Macquarie_Point_Hobart_Goods_Shed.jpg'),
    ),
    description:
      "Completed in December 1915, this long timber-framed shed handled fruit exports and goods from all over Tasmania through Hobart's railway yards. It was lengthened by six bays in the late 1940s, and rail goods operations moved to Brighton in 2014. It stands within the Macquarie Point redevelopment, so access can be limited.",
    sources: [
      thrEntry(10995, 'Hobart Railway Goods Shed'),
    ],
  },
  {
    id: 16,
    thr: 10047,
    name: 'Supreme Court Complex',
    shortName: 'Supreme Court',
    category: 'civic',
    categoryLabel: 'Civic Heritage',
    area: 'CBD',
    builtYear: '1980',
    coordinates: { lat: -42.88623, lng: 147.32989 }, // centre of the listed area on Salamanca Place (THR 10047)
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 36,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Supreme_Court_of_Tasmania_building_in_Hobart.jpg/1280px-Supreme_Court_of_Tasmania_building_in_Hobart.jpg',
      'Supreme Court of Tasmania',
      '2009',
      'The modernist court buildings and their plaza.',
      credit('Barrylb', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Supreme_Court_of_Tasmania_building_in_Hobart.jpg'),
    ),
    description:
      "The Supreme Court of Van Diemen's Land first sat in 1824, making it the oldest Supreme Court in Australia. This modernist complex beside St David's Park was designed by the Department of Public Works, and its final stage opened in 1980. In 2010 it received the Australian Institute of Architects' 25 Year Award.",
    sources: [
      thrEntry(10047, 'Hobart Supreme Court Complex'),
      webSource('Supreme Court of Tasmania', 'History of the Court', 'https://www.supremecourt.tas.gov.au/the-court/history/'),
    ],
  },
  {
    id: 17,
    thr: 12038,
    name: 'Carnegie Building',
    shortName: 'Carnegie',
    category: 'civic',
    categoryLabel: 'Civic Heritage',
    area: 'Waterfront',
    builtYear: '1907',
    coordinates: { lat: -42.88263, lng: 147.33162 }, // 16 Argyle St (OpenStreetMap); THR 12038
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 51,
    ...singlePhoto(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Maritime_Museum_of_Tasmania_%282023%29.jpg/1280px-Maritime_Museum_of_Tasmania_%282023%29.jpg',
      'Carnegie Building',
      '2023',
      'The red brick library building, now the Maritime Museum.',
      credit('Canley', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Maritime_Museum_of_Tasmania_(2023).jpg'),
    ),
    description:
      'The Tasmanian Public Library opened here in 1907, the only library building in Tasmania funded by the philanthropist Andrew Carnegie. The two-storey red brick building on sandstone foundations shows bold Edwardian Baroque detail. The Maritime Museum of Tasmania moved into it in 1999.',
    sources: [
      thrEntry(12038, 'Tasmanian Public Library/Carnegie Building'),
    ],
  },
  {
    id: 18,
    thr: 2626,
    name: 'Alexandra Battery',
    shortName: 'Alexandra',
    category: 'military',
    categoryLabel: 'Military Heritage',
    area: 'Sandy Bay',
    builtYear: '1885',
    coordinates: { lat: -42.91502, lng: 147.35839 }, // the battery on Sandy Bay Rd (OpenStreetMap); THR 2626
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 47,
    ...singlePhoto(
      'https://live.staticflickr.com/8462/8014793717_85d523ab04_b.jpg',
      'Inside the passageways',
      '2012',
      'A stone passage leading through the battery’s earthworks.',
      credit('Raam Dev', 'CC BY-NC-SA 2.0', 'https://www.flickr.com/photos/89743353@N00/8014793717'),
    ),
    description:
      'Work on this battery began in 1871 and, after a pause, was completed in 1885 to guard the river approaches to Hobart. Troops camped here during the First World War, and it served as a military training camp until the Second. It opened as a public park in 1964, with stone passageways still to explore.',
    sources: [
      thrEntry(2626, 'Alexandra Battery'),
    ],
  },
  {
    id: 19,
    thr: 12100,
    name: 'Runnymede',
    shortName: 'Runnymede',
    category: 'colonial',
    categoryLabel: 'Colonial Living',
    area: 'New Town',
    builtYear: 'c.1836',
    coordinates: { lat: -42.85277, lng: 147.3119 }, // 61 Bay Rd (OpenStreetMap); THR 12100
    accessible: false, // step-free access not yet verified from an official source
    baseLikes: 64,
    ...singlePhoto(
      'https://live.staticflickr.com/3773/11184769603_fa73491e18_b.jpg',
      'Runnymede House',
      '2011',
      'The verandah and French doors of the house.',
      credit('denisbin', 'CC BY-ND 2.0', 'https://www.flickr.com/photos/82134796@N03/11184769603'),
    ),
    description:
      'This Regency-style marine villa was built for Robert Pitcairn, who bought the land in 1836. Bishop Francis Nixon lived here from 1850, and in 1863 Captain Charles Bayley renamed it Runnymede after one of his ships. The State Government bought it in 1965, and since 2011 it has been owned by the National Trust.',
    sources: [
      thrEntry(12100, 'Runnymede'),
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
