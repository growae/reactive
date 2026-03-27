import { describe, expect, it, vi } from 'vitest'
import { createEmitter } from '../createEmitter'
import { mainnet, testnet } from '../types/network'
import type { ConnectorEventMap } from './createConnector'
import { mock } from './mock'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
  'ak_wMd5Yco4BDvRH7MJJSExXkRrFxJ27BaFiDR1nTjJPFp5Rnw4V',
] as const

function setupConnector(features?: Parameters<typeof mock>[0]['features']) {
  const connectorFn = mock({ accounts: [...TEST_ACCOUNTS], features })
  const emitter = createEmitter<ConnectorEventMap>('test-uid')
  const connector = connectorFn({
    emitter,
    networks: [testnet, mainnet],
  })
  return { connector, emitter }
}

describe('mock connector', () => {
  it('should have correct metadata', () => {
    const { connector } = setupConnector()
    expect(connector.id).toBe('mock')
    expect(connector.name).toBe('Mock Connector')
    expect(connector.type).toBe('mock')
  })

  it('should set type on function', () => {
    expect(mock.type).toBe('mock')
  })

  describe('connect', () => {
    it('should connect and return accounts and networkId', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      const result = await connector.connect()
      expect(result.accounts).toEqual(TEST_ACCOUNTS)
      expect(result.networkId).toBe(testnet.id)
    })

    it('should throw when connectError feature is enabled', async () => {
      const { connector } = setupConnector({ connectError: true })
      await connector.setup?.()
      await expect(connector.connect()).rejects.toThrow('Failed to connect.')
    })

    it('should throw custom connect error', async () => {
      const customError = new Error('Custom error')
      const { connector } = setupConnector({ connectError: customError })
      await connector.setup?.()
      await expect(connector.connect()).rejects.toThrow('Custom error')
    })
  })

  describe('disconnect', () => {
    it('should disconnect without error', async () => {
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
      expect(accounts).toEqual(TEST_ACCOUNTS)
    })

    it('should throw when not connected', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await expect(connector.getAccounts()).rejects.toThrow(
        'Connector not connected',
      )
    })
  })

  describe('getNetworkId', () => {
    it('should return current network id after setup', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      const networkId = await connector.getNetworkId()
      expect(networkId).toBe(testnet.id)
    })
  })

  describe('switchNetwork', () => {
    it('should switch to configured network', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      const result = await connector.switchNetwork!({ networkId: mainnet.id })
      expect(result.id).toBe(mainnet.id)
      expect(await connector.getNetworkId()).toBe(mainnet.id)
    })

    it('should throw for unconfigured network', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await expect(
        connector.switchNetwork!({ networkId: 'invalid' }),
      ).rejects.toThrow('Network not configured')
    })

    it('should throw when switchNetworkError is enabled', async () => {
      const { connector } = setupConnector({ switchNetworkError: true })
      await connector.setup?.()
      await expect(
        connector.switchNetwork!({ networkId: mainnet.id }),
      ).rejects.toThrow('Failed to switch network.')
    })
  })

  describe('signTransaction', () => {
    it('should return signed transaction', async () => {
      const { connector } = setupConnector()
      const result = await connector.signTransaction!({
        tx: 'tx_rawdata',
        networkId: testnet.id,
      })
      expect(result).toBe('signed_tx_rawdata')
    })

    it('should throw when signTransactionError is enabled', async () => {
      const { connector } = setupConnector({ signTransactionError: true })
      await expect(
        connector.signTransaction!({ tx: 'tx_data', networkId: testnet.id }),
      ).rejects.toThrow('Failed to sign transaction.')
    })
  })

  describe('signMessage', () => {
    it('should return signed message', async () => {
      const { connector } = setupConnector()
      const result = await connector.signMessage!({ message: 'hello' })
      expect(result).toBe('signed_hello')
    })

    it('should throw when signMessageError is enabled', async () => {
      const { connector } = setupConnector({ signMessageError: true })
      await expect(
        connector.signMessage!({ message: 'hello' }),
      ).rejects.toThrow('Failed to sign message.')
    })
  })

  describe('isAuthorized', () => {
    it('should return false by default', async () => {
      const { connector } = setupConnector()
      expect(await connector.isAuthorized()).toBe(false)
    })

    it('should return true when reconnect enabled and connected', async () => {
      const { connector } = setupConnector({
        reconnect: true,
        defaultConnected: true,
      })
      await connector.setup?.()
      expect(await connector.isAuthorized()).toBe(true)
    })
  })

  describe('getProvider', () => {
    it('should return a provider with request method', async () => {
      const { connector } = setupConnector()
      const provider = await connector.getProvider()
      expect(provider).toBeDefined()
      expect(typeof provider.request).toBe('function')
    })
  })

  describe('event emission', () => {
    it('should emit change on onAccountsChanged', () => {
      const { connector, emitter } = setupConnector()
      const handler = vi.fn()
      emitter.on('change', handler)
      connector.onAccountsChanged(['ak_newAccount'])
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ accounts: ['ak_newAccount'] }),
      )
    })

    it('should emit disconnect on empty accounts', () => {
      const { connector, emitter } = setupConnector()
      const handler = vi.fn()
      emitter.on('disconnect', handler)
      connector.onAccountsChanged([])
      expect(handler).toHaveBeenCalled()
    })

    it('should emit change on onNetworkChanged', () => {
      const { connector, emitter } = setupConnector()
      const handler = vi.fn()
      emitter.on('change', handler)
      connector.onNetworkChanged('ae_mainnet')
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ networkId: 'ae_mainnet' }),
      )
    })
  })
})
