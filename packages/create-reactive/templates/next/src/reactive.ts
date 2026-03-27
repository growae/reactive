import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'

export const config = createConfig({
  networks: [testnet],
  connectors: [],
})

declare module '@growae/reactive' {
  interface Register {
    config: typeof config
  }
}
