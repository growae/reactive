import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { mock } from '../connectors/mock'
import { createConfig } from '../createConfig'
import { testnet } from '../types/network'
import { connect } from './connect'
import { signMessage } from './signMessage'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

function createTestConfig() {
  return createConfig({
    networks: [testnet],
    connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
    storage: null,
  })
}

describe('signMessage', () => {
  it('should sign a message and return signature', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    const result = await signMessage(config, { message: 'hello world' })
    expect(result).toEqual({ signature: 'signed_hello world' })
  })

  it('should throw when no account is connected', async () => {
    const config = createTestConfig()
    await expect(signMessage(config, { message: 'test' })).rejects.toThrow(
      'No connected account',
    )
  })

  it('should throw when signMessageError is enabled', async () => {
    const config = createConfig({
      networks: [testnet],
      connectors: [
        mock({
          accounts: [...TEST_ACCOUNTS],
          features: { signMessageError: true },
        }),
      ],
      storage: null,
    })
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await expect(signMessage(config, { message: 'test' })).rejects.toThrow(
      'Failed to sign message.',
    )
  })
})
