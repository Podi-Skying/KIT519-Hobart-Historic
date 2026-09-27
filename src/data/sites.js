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
        'Trapezoid-headed windows of 1836; the porch window came in 1888.',
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
    builtYear: '1835–1860',
    coordinates: { lat: -42.88696, lng: 147.33244 }, // 45 Salamanca Pl
    accessible: true,
    baseLikes: 181,
    image: landmarkImage('salamanca-main.webp'),
    arImage: landmarkImage('salamanca-main.webp'),
    arApproachImage: landmarkImage('salamanca-gallery-1.webp'),
    description:
      'Rows of sandstone warehouses that once stored whaling and trading goods. Today the precinct hosts markets, galleries and restaurants while keeping its colonial character.',
    gallery: [
      photo('salamanca-gallery-1.webp', 'Salamanca streetscape', '2008', 'The row of convict-built warehouses.', credit('Adam Selwood', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:SalamancaPlace2008.jpg')),
      photo('salamanca-gallery-2.webp', 'Salamanca Market', '2007', 'Market stalls along the warehouses.', credit('Synyan', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Salamanca_market_in_Hobart.JPG')),
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
        'The chapel tower, begun in 1830.',
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
