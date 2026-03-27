import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ReactivePlugin } from '@growae/reactive-vue'
import { createConfig, testnet } from '@growae/reactive'
import App from './App.vue'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(ReactivePlugin, { config })
app.mount('#app')
