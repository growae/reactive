import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  MemoryAccount: vi.fn().mockImplementation(() => ({
    address: 'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
    sign: vi.fn().mockResolvedValue(new Uint8Array(64)),
    signTransaction: vi.fn().mockResolvedValue('signed_tx_data'),
  })),
}))

import { MemoryAccount } from '@aeternity/aepp-sdk'
import { createEmitter } from '../createEmitter.js'
import { ConnectorAccountUnavailableError } from '../errors/connector.js'
import { mainnet, testnet } from '../types/network.js'
import type { ConnectorEventMap } from './createConnector.js'
import { memory } from './memory.js'

function setupConnector(secretKey = 'test_secret_key', name?: string) {
  const connectorFn = memory({ accounts: [{ secretKey }], name })
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

    // The SDK rejects a signing call with no network id, and signs for the
    // wrong chain if given the wrong one, so assert both options reach it.
    it('should forward networkId and innerTx to the account', async () => {
      const { connector } = setupConnector()
      await connector.setup?.()
      await connector.connect?.({ networkId: testnet.id })

      const signed = await connector.signTransaction!({
        tx: 'tx_data',
        networkId: testnet.id,
        innerTx: true,
      })

      expect(signed).toBe('signed_tx_data')
      const account = vi.mocked(MemoryAccount).mock.results[0]!.value
      expect(account.signTransaction).toHaveBeenCalledWith('tx_data', {
        networkId: testnet.id,
        innerTx: true,
      })
    })
  })

  /**
   * The connector holds every account it was configured with, so `onAccount`
   * selects between them rather than being a hint. It shipped signing with
   * `accounts[0]` unconditionally, which is the account the built transaction
   * belongs to only until the user switches.
   */
  describe('signTransaction onAccount', () => {
    const ADDRESSES = ['ak_first', 'ak_second']

    function setupMultiAccount() {
      vi.mocked(MemoryAccount).mockImplementation(((): unknown => {
        const address = ADDRESSES[
          vi.mocked(MemoryAccount).mock.calls.length - 1
        ] as string
        return {
          address,
          sign: vi.fn().mockResolvedValue(new Uint8Array(64)),
          signTransaction: vi.fn().mockResolvedValue(`signed_by_${address}`),
        }
      }) as never)
      const connectorFn = memory({
        accounts: [{ secretKey: 'k1' }, { secretKey: 'k2' }],
      })
      return connectorFn({
        emitter: createEmitter<ConnectorEventMap>('mem-uid'),
        networks: [testnet, mainnet],
      })
    }

    it('signs with the named account rather than the first', async () => {
      const connector = setupMultiAccount()
      await connector.setup?.()
      await connector.connect?.({ networkId: testnet.id })

      const signed = await connector.signTransaction!({
        tx: 'tx_data',
        networkId: testnet.id,
        onAccount: 'ak_second',
      })

      expect(signed).toBe('signed_by_ak_second')
    })

    it('falls back to the first account when none is named', async () => {
      const connector = setupMultiAccount()
      await connector.setup?.()
      await connector.connect?.({ networkId: testnet.id })

      const signed = await connector.signTransaction!({
        tx: 'tx_data',
        networkId: testnet.id,
      })

      expect(signed).toBe('signed_by_ak_first')
    })

    it('throws for an account it does not hold rather than falling back', async () => {
      const connector = setupMultiAccount()
      await connector.setup?.()
      await connector.connect?.({ networkId: testnet.id })

      await expect(
        connector.signTransaction!({
          tx: 'tx_data',
          networkId: testnet.id,
          onAccount: 'ak_notMine',
        }),
      ).rejects.toThrow(ConnectorAccountUnavailableError)
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
