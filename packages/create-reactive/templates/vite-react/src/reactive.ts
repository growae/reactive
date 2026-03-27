import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'

export const config = createConfig({
  networks: [testnet],
  connectors: [],
})

declare module '@reactive/core' {
  interface Register {
    config: typeof config
  }
}
