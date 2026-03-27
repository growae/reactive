import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '../createConfig'
import { mainnet, testnet } from '../types/network'
import { getNetworkId } from './getNetworkId'

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
