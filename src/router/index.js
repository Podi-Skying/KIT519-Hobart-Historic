import { createRouter, createWebHashHistory } from 'vue-router'
import { getSiteById } from '@/data/sites'
import { useUiStore } from '@/stores/ui'

/**
 * Route meta
 *  tab          which tab-bar item is active
 *  hideTabBar   full-screen task flows (turn-by-turn navigation)
 *  status       status-bar appearance:
 *               tone        'dark' | 'light' text while at the top of the page
 *               solidBg     background once the page scrolls (omit = always transparent)
 *               solidTone   text tone on that background (default 'dark')
 */
const onCream = { tone: 'dark', solidBg: 'var(--cream)' }
const onPhoto = { tone: 'light', solidBg: 'var(--cream)', solidTone: 'dark' }
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
    meta: { tab: 'home', status: { tone: 'dark', solidBg: 'var(--cream)' } },
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
  {
    path: '/navigate/:id(\\d+)',
    name: 'navigate',
    component: () => import('@/views/NavigationModesView.vue'),
    props: siteProps,
    beforeEnter: requireSite,
    meta: { tab: 'map', status: onCream },
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
    path: '/ar',
    name: 'ar',
    component: () => import('@/views/ArCameraView.vue'),
    meta: { tab: 'ar', status: overCamera },
  },
  {
    path: '/ar/compare',
    name: 'ar-compare',
    component: () => import('@/views/ArCompareView.vue'),
    meta: { tab: 'ar', status: overCamera },
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

router.afterEach(() => {
  useUiStore().setStatusBarSolid(false)
})
