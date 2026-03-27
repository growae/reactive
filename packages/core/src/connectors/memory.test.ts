import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  MemoryAccount: vi.fn().mockImplementation(() => ({
    address: 'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
    sign: vi.fn().mockResolvedValue(new Uint8Array(64)),
    signTransaction: vi.fn().mockResolvedValue('signed_tx_data'),
  })),
}))

import { MemoryAccount } from '@aeternity/aepp-sdk'
import { createEmitter } from '../createEmitter'
import { mainnet, testnet } from '../types/network'
import type { ConnectorEventMap } from './createConnector'
import { memory } from './memory'

function setupConnector(secretKey = 'test_secret_key', name?: string) {
  const connectorFn = memory({ secretKey, name })
  const emitter = createEmitter<ConnectorEventMap>('mem-uid')
  const connector = connectorFn({
    emitter,
    networks: [testnet, mainnet],
  })
  return { connector, emitter }
}

describe('memory connector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct default name', () => {
    const { connector } = setupConnector()
    expect(connector.id).toBe('memory')
    expect(connector.name).toBe('Memory Account')
    expect(connector.type).toBe('memory')
  })

  it('should accept custom name', () => {
    const { connector } = setupConnector('key', 'My Account')
    expect(connector.name).toBe('My Account')
  })

  it('should set type on function', () => {
    expect(memory.type).toBe('memory')
  })

  describe('setup', () => {
    it('should create MemoryAccount with secretKey', async () => {
      const { connector } = setupConnector('sk_test123')
      await connector.setup?.()
      expect(MemoryAccount).toHaveBeenCalledWith('sk_test123')
    })
  })

  describe('connect', () => {
    it('should connect and return account address', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      const result = await connector.connect()
      expect(result.accounts).toContain(
        'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
      )
      expect(result.networkId).toBe(testnet.id)
    })

    it('should connect to specified network', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      const result = await connector.connect({ networkId: mainnet.id })
      expect(result.networkId).toBe(mainnet.id)
    })

    it('should throw for unconfigured network', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await expect(
        connector.connect({ networkId: 'invalid_net' }),
      ).rejects.toThrow('Network not configured')
    })
  })

  describe('disconnect', () => {
    it('should disconnect', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await connector.connect()
      await expect(connector.disconnect()).resolves.toBeUndefined()
    })
  })

  describe('getAccounts', () => {
    it('should return accounts when connected', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await connector.connect()
      const accounts = await connector.getAccounts()
      expect(accounts).toHaveLength(1)
    })

    it('should throw when not connected', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await expect(connector.getAccounts()).rejects.toThrow(
        'Connector not connected',
      )
    })
  })

  describe('isAuthorized', () => {
    it('should return false when not connected', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      expect(await connector.isAuthorized()).toBe(false)
    })

    it('should return true when connected', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await connector.connect()
      expect(await connector.isAuthorized()).toBe(true)
    })
  })

  describe('switchNetwork', () => {
    it('should switch to configured network', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      const result = await connector.switchNetwork!({ networkId: mainnet.id })
      expect(result.id).toBe(mainnet.id)
    })

    it('should throw for unconfigured network', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await expect(
        connector.switchNetwork!({ networkId: 'invalid' }),
      ).rejects.toThrow('Network not configured')
    })
  })

  describe('signTransaction', () => {
    it('should throw when not connected', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await expect(
        connector.signTransaction!({ tx: 'tx_data', networkId: testnet.id }),
      ).rejects.toThrow('Connector not connected')
    })
  })

  describe('signMessage', () => {
    it('should throw when not connected', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await expect(
        connector.signMessage!({ message: 'hello' }),
      ).rejects.toThrow('Connector not connected')
    })
  })
})
