import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { mock } from '../connectors/mock'
import { createConfig } from '../createConfig'
import { mainnet } from '../types/network'
import { connect } from './connect'
import { getActiveAccount } from './getActiveAccount'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

describe('getActiveAccount', () => {
  it('returns undefined when disconnected', () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    const result = getActiveAccount(config)
    expect(result.isConnected).toBe(false)
    expect(result.address).toBeUndefined()
  })

  it('returns active account when connected', async () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    await connect(config, { connector: config.connectors[0]! })
    const result = getActiveAccount(config)
    expect(result.isConnected).toBe(true)
    expect(result.address).toBeDefined()
    expect(typeof result.address).toBe('string')
  })

  it('returns addresses and connector when connected', async () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    await connect(config, { connector: config.connectors[0]! })
    const result = getActiveAccount(config)
    expect(result.isConnected).toBe(true)
    if (result.isConnected) {
      expect(result.addresses).toEqual(TEST_ACCOUNTS)
      expect(result.connector).toBeDefined()
    }
  })
})
