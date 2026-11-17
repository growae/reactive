import { createConfig, mainnet, testnet } from '@growae/reactive'
import { metamaskSnap } from '@growae/reactive-connectors'
import { ReactivePlugin } from '@growae/reactive-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'

const config = createConfig({
  networks: [testnet, mainnet],
  connectors: [metamaskSnap()],
})

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(ReactivePlugin, { config })
app.mount('#app')
