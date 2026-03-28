import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { mock } from '../connectors/mock'
import { createConfig } from '../createConfig'
import { mainnet } from '../types/network'
import { connect } from './connect'
import { switchActiveAccount } from './switchActiveAccount'
import { watchActiveAccount } from './watchActiveAccount'

const TEST_ACCOUNTS = ['ak_addr1', 'ak_addr2'] as const

describe('watchActiveAccount', () => {
  it('calls onChange when active account changes', async () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    await connect(config, { connector: config.connectors[0]! })

    const onChange = vi.fn()
    const unwatch = watchActiveAccount(config, { onChange })

    switchActiveAccount(config, { account: 'ak_addr2' })

    expect(onChange).toHaveBeenCalledOnce()
    unwatch()
  })

  it('passes current and previous account to onChange', async () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    await connect(config, { connector: config.connectors[0]! })

    const onChange = vi.fn()
    const unwatch = watchActiveAccount(config, { onChange })

    switchActiveAccount(config, { account: 'ak_addr2' })

    const [activeAccount, prevActiveAccount] = onChange.mock.calls[0]!
    expect(activeAccount.address).toBe('ak_addr2')
    expect(prevActiveAccount.address).toBe('ak_addr1')
    unwatch()
  })

  it('returns an unsubscribe function', async () => {
    const config = createConfig({
      networks: [mainnet],
      connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
      storage: null,
    })
    await connect(config, { connector: config.connectors[0]! })

    const onChange = vi.fn()
    const unwatch = watchActiveAccount(config, { onChange })
    unwatch()

    switchActiveAccount(config, { account: 'ak_addr2' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
