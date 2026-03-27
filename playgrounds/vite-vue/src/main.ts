import { createConfig, testnet } from '@growae/reactive'
import { ReactivePlugin } from '@growae/reactive-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(ReactivePlugin, { config })
app.mount('#app')
