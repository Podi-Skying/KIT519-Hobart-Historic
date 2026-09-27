import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './router'
import { persistPlugin } from './plugins/persist'
import { i18n } from './i18n'

import './styles/tokens.css'
import './styles/base.css'

// iOS Safari only applies :active (our press feedback, base.css › Press feedback) once the
// page has a touchstart listener. Passive, so it never delays scrolling.
document.addEventListener('touchstart', () => {}, { passive: true })

const pinia = createPinia()
pinia.use(persistPlugin)

createApp(App).use(pinia).use(i18n).use(router).mount('#app')
