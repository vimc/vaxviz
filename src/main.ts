import { createApp } from 'vue'
import { createPinia } from 'pinia'
import posthog from "posthog-js";

import App from './App.vue'
import router from './router'

import "vue3-select-component/styles";
import "./assets/styles/main.css"
import { analyticsPermittedInitially } from './utils/analytics';

if (analyticsPermittedInitially) {
  // This API key is not a secret. https://mrc-ide.myjetbrains.com/youtrack/articles/RESIDE-A-56/Analytics-and-user-consent
  posthog.init('phc_Lk7j9M24DQ0A4NMdfc0UVPM7gPFXpVylfT6YhCZLqet', {
    cookieless_mode: 'always',
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
  });
};

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
