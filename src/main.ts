import { createApp } from 'vue'
import { createPinia } from 'pinia'
import posthog from 'posthog-js'

import App from './App.vue'
import router from './router'

import "vue3-select-component/styles";
import "./assets/styles/main.css"

posthog.init('phc_Lk7j9M24DQ0A4NMdfc0UVPM7gPFXpVylfT6YhCZLqet', {
  cookieless_mode: 'always',
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  // Disable bot detection - Playwright is detected as a bot
  opt_out_useragent_filter: !!process.env.NODE_ENV && ['test', 'development'].includes(process.env.NODE_ENV),
  // Disable batching in tests - events send immediately
  request_batching: !!process.env.NODE_ENV && ['test', 'development'].includes(process.env.NODE_ENV),
});

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
