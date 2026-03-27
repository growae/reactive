import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { mock } from '../connectors/mock'
import { createConfig } from '../createConfig'
import { ConnectorAlreadyConnectedError } from '../errors/config'
import { mainnet, testnet } from '../types/network'
import { connect } from './connect'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

function createTestConfig() {
  return createConfig({
    networks: [testnet, mainnet],
    connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
    storage: null,
  })
}

describe('connect', () => {
  it('should connect and return accounts', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    const result = await connect(config, { connector })

    expect(result.accounts).toEqual(TEST_ACCOUNTS)
    expect(result.networkId).toBe('ae_uat')
  })

  it('should update config state to connected', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    expect(config.state.status).toBe('connected')
    expect(config.state.current).toBe(connector.uid)
    expect(config.state.connections.size).toBe(1)
  })

  it('should throw ConnectorAlreadyConnectedError if already connected', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await expect(connect(config, { connector })).rejects.toThrow(
      ConnectorAlreadyConnectedError,
    )
  })

  it('should accept a connector factory function', async () => {
    const config = createConfig({ networks: [testnet], storage: null })
    const result = await connect(config, {
      connector: mock({ accounts: [...TEST_ACCOUNTS] }),
    })
    expect(result.accounts).toBeDefined()
    expect(config.state.status).toBe('connected')
  })

  it('should store connection in state', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    const connection = config.state.connections.get(connector.uid)
    expect(connection).toBeDefined()
    expect(connection!.accounts).toEqual(TEST_ACCOUNTS)
    expect(connection!.connector).toBe(connector)
  })

  it('should set status back on connect error', async () => {
    const config = createConfig({
      networks: [testnet],
      connectors: [
        mock({
          accounts: [...TEST_ACCOUNTS],
          features: { connectError: true },
        }),
      ],
      storage: null,
    })
    const connector = config.connectors[0]!

    await expect(connect(config, { connector })).rejects.toThrow()
    expect(config.state.status).toBe('disconnected')
  })
})
