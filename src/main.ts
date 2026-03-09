import { createApp } from 'vue'
import { createPinia } from 'pinia'
import posthog from 'posthog-js'

import App from './App.vue'
import router from './router'

import "vue3-select-component/styles";
import "./assets/styles/main.css"
import { initialisePosthog } from './utils/analytics';

if (process.env.NODE_ENV && !['development', 'test'].includes(process.env.NODE_ENV)) {
  initialisePosthog();
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.errorHandler = (err) => {
  posthog.captureException(err);
};

app.mount('#app')
