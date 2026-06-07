import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import Toast from "vue-toastification";
import App from './App.vue'
import './assets/main.css'
import "vue-toastification/dist/index.css";


const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Toast)
app.mount('#app')
