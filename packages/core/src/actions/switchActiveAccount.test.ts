import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { mock } from '../connectors/mock.js'
import { createConfig } from '../createConfig.js'
import { AccountNotFoundError } from '../errors/account.js'
import { mainnet } from '../types/network.js'
import { connect } from './connect.js'
import { getActiveAccount } from './getActiveAccount.js'
import { switchActiveAccount } from './switchActiveAccount.js'

const TEST_ACCOUNTS = ['ak_addr1', 'ak_addr2'] as const

describe('switchActiveAccount', () => {
  it('throws when not connected', () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    expect(() => switchActiveAccount(config, { account: 'ak_addr1' })).toThrow(
      AccountNotFoundError,
    )
  })

  it('throws when account not in connected accounts', async () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    await connect(config, { connector: config.connectors[0]! })
    expect(() =>
      switchActiveAccount(config, { account: 'ak_nonexistent' }),
    ).toThrow(AccountNotFoundError)
  })

  it('switches active account when account exists', async () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    await connect(config, { connector: config.connectors[0]! })

    switchActiveAccount(config, { account: 'ak_addr2' })
    const result = getActiveAccount(config)
    expect(result.address).toBe('ak_addr2')
  })
})
