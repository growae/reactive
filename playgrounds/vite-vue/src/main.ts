import { createConfig, mainnet, memory, testnet } from '@growae/reactive'
import { ReactivePlugin } from '@growae/reactive-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'

const config = createConfig({
  networks: [testnet, mainnet],
  connectors: [
    memory({
      accounts: [
        { secretKey: 'sk_2m9oLEdkrZup7jmtK6rCWVLmGdn8Bmqxd3enGZfYjLxrCpJmPf' },
        { secretKey: 'sk_ZxLc2E9eb2wLucHXtumzQPR1FmesiaragSNurALyrMA3Fz6aC' },
        { secretKey: 'sk_yLicaWqRyigTBAUddCcYtGbHAHZSMyt6guF2KSPMrd2LYY2h2' },
      ],
      name: 'Memory Wallet',
    }),
  ],
})

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(ReactivePlugin, { config })
app.mount('#app')
