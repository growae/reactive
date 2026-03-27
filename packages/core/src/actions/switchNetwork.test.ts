import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '../createConfig.js'
import { NetworkNotConfiguredError } from '../errors/config.js'
import { mainnet, testnet } from '../types/network.js'
import { switchNetwork } from './switchNetwork.js'

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
