import { createConfig } from '@growae/reactive'
import { ReactivePlugin } from '@growae/reactive-vue'
import { testnet } from '@growae/reactive/networks'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'

import App from './App.vue'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

const app = createApp(App)
app.use(ReactivePlugin, { config })
app.use(VueQueryPlugin)
app.mount('#app')
