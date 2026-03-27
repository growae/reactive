import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { createConfig } from '../createConfig'
import { NetworkNotConfiguredError } from '../errors/config'
import { mainnet, testnet } from '../types/network'
import { switchNetwork } from './switchNetwork'

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
