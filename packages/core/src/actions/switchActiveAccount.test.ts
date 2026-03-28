import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { mock } from '../connectors/mock'
import { createConfig } from '../createConfig'
import { AccountNotFoundError } from '../errors/account'
import { mainnet } from '../types/network'
import { connect } from './connect'
import { getActiveAccount } from './getActiveAccount'
import { switchActiveAccount } from './switchActiveAccount'

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
