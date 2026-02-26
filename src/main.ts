import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import "vue3-select-component/styles";
import "./assets/styles/main.css"
import { initialisePosthog } from './utils/analytics';

initialisePosthog();

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
