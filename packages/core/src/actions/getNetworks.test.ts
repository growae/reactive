import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { getNetworks } from './getNetworks.js'
import { createConfig } from '../createConfig.js'
import { testnet, mainnet } from '../types/network.js'

describe('getNetworks', () => {
  it('should return configured networks', () => {
    const config = createConfig({
      networks: [testnet, mainnet],
      storage: null,
    })
    const networks = getNetworks(config)
    expect(networks).toHaveLength(2)
    expect(networks[0]).toEqual(testnet)
    expect(networks[1]).toEqual(mainnet)
  })

  it('should return the same reference as config.networks', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    expect(getNetworks(config)).toBe(config.networks)
  })
})
