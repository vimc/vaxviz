import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import "vue3-select-component/styles";
import "./assets/styles/main.css"
import { useAppStore } from './stores/appStore';

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

const appStore = useAppStore();
appStore.initialize();
