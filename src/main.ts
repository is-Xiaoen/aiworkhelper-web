import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'nprogress/nprogress.css'
import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化用户信息
import { useUserStore } from './stores/user'
const userStore = useUserStore()
userStore.initUserInfo()

app.mount('#app')
