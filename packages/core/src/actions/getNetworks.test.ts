import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '../createConfig'
import { mainnet, testnet } from '../types/network'
import { getNetworks } from './getNetworks'

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
