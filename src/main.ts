import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { APP_NAME } from '@/config/env'

// Set document title from env config
document.title = APP_NAME

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
