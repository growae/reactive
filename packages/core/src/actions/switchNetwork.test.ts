import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { switchNetwork } from './switchNetwork.js'
import { createConfig } from '../createConfig.js'
import { testnet, mainnet } from '../types/network.js'
import { NetworkNotConfiguredError } from '../errors/config.js'

describe('switchNetwork', () => {
  it('should throw NetworkNotConfiguredError for unknown network', async () => {
    const config = createConfig({
      networks: [testnet, mainnet],
      storage: null,
    })
    await expect(
      switchNetwork(config, { networkId: 'unknown_net' }),
    ).rejects.toThrow(NetworkNotConfiguredError)
  })
})
