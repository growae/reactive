import { createConfig, testnet } from '@growae/reactive'
import { metamaskSnap } from '@growae/reactive-connectors'
import { ReactivePlugin } from '@growae/reactive-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin(({ vueApp }) => {
  const config = createConfig({
    networks: [testnet],
    connectors: [metamaskSnap()],
    ssr: true,
  })
  vueApp.use(VueQueryPlugin)
  vueApp.use(ReactivePlugin, { config })
})
