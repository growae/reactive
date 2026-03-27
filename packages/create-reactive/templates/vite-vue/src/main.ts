import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ReactivePlugin } from '@reactive/vue'
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'

import App from './App.vue'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

const app = createApp(App)
app.use(ReactivePlugin, { config })
app.use(VueQueryPlugin)
app.mount('#app')
