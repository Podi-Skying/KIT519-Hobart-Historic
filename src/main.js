import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './router'
import { persistPlugin } from './plugins/persist'
import { i18n } from './i18n'

import './styles/tokens.css'
import './styles/base.css'

const pinia = createPinia()
pinia.use(persistPlugin)

createApp(App).use(pinia).use(i18n).use(router).mount('#app')
