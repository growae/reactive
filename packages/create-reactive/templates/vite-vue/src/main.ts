import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ReactivePlugin } from '@growae/reactive-vue'
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'

import App from './App.vue'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

const app = createApp(App)
app.use(ReactivePlugin, { config })
app.use(VueQueryPlugin)
app.mount('#app')
