import './styles/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { setupRouter } from '@/router'

const app = createApp(App)

app.use(createPinia())
app.use(setupRouter())

app.mount('#app')
