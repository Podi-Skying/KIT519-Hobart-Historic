import { createRouter, createWebHashHistory } from 'vue-router'
import { getSiteById } from '@/data/sites'
import { useUiStore } from '@/stores/ui'
import { pageTransition } from '@/lib/pageTransition'

/**
 * Route meta
 *  tab          which tab-bar item is active
 *  hideTabBar   full-screen task flows (turn-by-turn navigation)
 *  status       status-bar appearance:
 *               tone        'dark' | 'light' text while at the top of the page
 *               solidBg     background once the page scrolls (omit = always transparent)
 *               solidTone   text tone on that background (default 'dark')
 */
// Once the page scrolls, the status bar becomes translucent cream material (content blurs underneath).
const onCream = { tone: 'dark', solidBg: 'var(--material-bar)' }
const onPhoto = { tone: 'light', solidBg: 'var(--material-bar)', solidTone: 'dark' }
const overCamera = { tone: 'light' }

/** Reject unknown site ids instead of rendering an empty page. */
const requireSite = (to) => (getSiteById(to.params.id) ? true : { name: 'home' })

const siteProps = (route) => ({ id: Number(route.params.id) })

const routes = [
  { path: '/', redirect: { name: 'home' } },
  // Old v1/v2 links keep working (query string is preserved).
  { path: '/explore', redirect: (to) => ({ name: 'home', query: to.query }) },

  // ---- Home tab ----
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    // Status bar turns cream once the white header has scrolled away (see HomeView `solid-after`).
    meta: { tab: 'home', status: { tone: 'dark', solidBg: 'var(--material-bar)' } },
  },
  {
    path: '/sites/:id(\\d+)',
    name: 'site',
    component: () => import('@/views/SiteDetailView.vue'),
    props: siteProps,
    beforeEnter: requireSite,
    meta: { tab: 'home', status: onPhoto },
  },
  {
    path: '/sites/:id(\\d+)/gallery/:index(\\d+)?',
    name: 'gallery',
    component: () => import('@/views/GalleryView.vue'),
    props: (route) => ({ id: Number(route.params.id), index: Number(route.params.index ?? 0) }),
    beforeEnter: requireSite,
    meta: { tab: 'home', status: onCream },
  },
  {
    path: '/sites/:id(\\d+)/audio',
    name: 'audio',
    component: () => import('@/views/AudioTourView.vue'),
    props: siteProps,
    beforeEnter: requireSite,
    meta: { tab: 'home', status: onCream },
  },

  // ---- Map tab & navigation flow ----
  {
    path: '/map',
    name: 'map',
    component: () => import('@/views/MapView.vue'),
    meta: { tab: 'map', status: { tone: 'dark' } },
  },
  // Navigating starts straight on the standard map; AR / printable are an option there
  // (NavigationModeSheet). Old links to the former "how would you like to navigate?" page land there too.
  {
    path: '/navigate/:id(\\d+)',
    name: 'navigate',
    redirect: (to) => ({ name: 'navigate-map', params: to.params }),
  },
  {
    path: '/navigate/:id(\\d+)/map',
    name: 'navigate-map',
    component: () => import('@/views/StandardNavigationView.vue'),
    props: siteProps,
    beforeEnter: requireSite,
    meta: { tab: 'map', hideTabBar: true, status: { tone: 'dark' } },
  },
  {
    path: '/navigate/:id(\\d+)/ar',
    name: 'navigate-ar',
    component: () => import('@/views/ArNavigationView.vue'),
    props: siteProps,
    beforeEnter: requireSite,
    meta: { tab: 'map', hideTabBar: true, status: overCamera },
  },
  {
    path: '/navigate/:id(\\d+)/print',
    name: 'navigate-print',
    component: () => import('@/views/PrintableMapView.vue'),
    props: siteProps,
    beforeEnter: requireSite,
    meta: { tab: 'map', status: onCream },
  },

  // ---- AR tab ----
  {
    // No id = the landmark nearest to the walker (simulated detection).
    path: '/ar/:id(\\d+)?',
    name: 'ar',
    component: () => import('@/views/ArCameraView.vue'),
    props: (route) => ({ id: route.params.id ? Number(route.params.id) : null }),
    beforeEnter: (to) => (!to.params.id || getSiteById(to.params.id) ? true : { name: 'ar' }),
    meta: { tab: 'ar', status: overCamera },
  },
  // "Through time" now plays inside the AR camera view; old links land there.
  {
    path: '/ar/:id(\\d+)/compare',
    name: 'ar-compare',
    redirect: (to) => ({ name: 'ar', params: { id: to.params.id } }),
  },

  // ---- Weather tab ----
  {
    path: '/weather',
    name: 'weather',
    component: () => import('@/views/WeatherView.vue'),
    meta: { tab: 'weather', status: onCream },
  },

  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
]

export const router = createRouter({
  // Hash history: works on any static host (GitHub Pages etc.) without rewrites.
  history: createWebHashHistory(),
  routes,
})

/**
 * Every launch or refresh starts at the leading page (App.vue) and continues to Home, whatever
 * URL was open — the splash and language choice lead into Home only, never into a deep page.
 * Home's own filters (?category=&q=) are kept.
 */
let firstNavigation = true
router.beforeEach((to) => {
  if (!firstNavigation) return true
  firstNavigation = false
  return to.name === 'home' ? true : { name: 'home', replace: true }
})

router.afterEach((to, from) => {
  useUiStore().setStatusBarSolid(false)
  // push / pop / fade — read by App.vue's <Transition> (base.css › Route transitions)
  to.meta.transition = pageTransition(to, from)
})
