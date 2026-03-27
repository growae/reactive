import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => ({})),
}))

import { connect } from './connect.js'
import { disconnect } from './disconnect.js'
import { createConfig } from '../createConfig.js'
import { testnet } from '../types/network.js'
import { mock } from '../connectors/mock.js'

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

describe('disconnect', () => {
  it('should set status to disconnected', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    expect(config.state.status).toBe('connected')

    await disconnect(config)
    expect(config.state.status).toBe('disconnected')
  })

  it('should clear current connection', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await disconnect(config)

    expect(config.state.current).toBeNull()
    expect(config.state.connections.size).toBe(0)
  })

  it('should handle disconnect when already disconnected', async () => {
    const config = createTestConfig()
    await expect(disconnect(config)).resolves.toBeUndefined()
  })

  it('should accept explicit connector parameter', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await disconnect(config, { connector })
    expect(config.state.status).toBe('disconnected')
  })
})
