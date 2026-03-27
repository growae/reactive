import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { getNetworkId } from './getNetworkId.js'
import { createConfig } from '../createConfig.js'
import { testnet, mainnet } from '../types/network.js'

describe('getNetworkId', () => {
  it('should return the current network id', () => {
    const config = createConfig({ networks: [testnet], storage: null })
    expect(getNetworkId(config)).toBe('ae_uat')
  })

  it('should reflect state changes', () => {
    const config = createConfig({
      networks: [testnet, mainnet],
      storage: null,
    })
    expect(getNetworkId(config)).toBe('ae_uat')

    config.setState((s) => ({ ...s, networkId: 'ae_mainnet' }))
    expect(getNetworkId(config)).toBe('ae_mainnet')
  })
})
