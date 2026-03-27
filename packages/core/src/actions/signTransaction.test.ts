import { describe, expect, it, vi } from 'vitest'
import { signTransaction } from './signTransaction.js'

describe('signTransaction', () => {
  it('should be a function', () => {
    expect(typeof signTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(signTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when no connector is found', async () => {
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map(),
        current: undefined,
      },
    }
    await expect(
      signTransaction(mockConfig as any, { tx: 'tx_test' }),
    ).rejects.toThrow(/No connector found/)
  })

  it('should sign transaction using connector', async () => {
    const mockConnector = {
      signTransaction: vi.fn().mockResolvedValue('signed_tx'),
    }
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map([['uid1', { connector: mockConnector }]]),
        current: 'uid1',
      },
    }

    const result = await signTransaction(mockConfig as any, { tx: 'tx_test' })
    expect(result).toBe('signed_tx')
    expect(mockConnector.signTransaction).toHaveBeenCalledWith('tx_test', {
      networkId: 'ae_uat',
      innerTx: undefined,
    })
  })

  it('should use provided connector over current connection', async () => {
    const explicitConnector = {
      signTransaction: vi.fn().mockResolvedValue('signed_explicit'),
    }
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map(),
        current: undefined,
      },
    }

    const result = await signTransaction(mockConfig as any, {
      tx: 'tx_test',
      connector: explicitConnector as any,
    })
    expect(result).toBe('signed_explicit')
  })

  it('should pass innerTx flag to connector', async () => {
    const mockConnector = {
      signTransaction: vi.fn().mockResolvedValue('signed_inner'),
    }
    const mockConfig = {
      state: {
        networkId: 'ae_uat',
        connections: new Map([['uid1', { connector: mockConnector }]]),
        current: 'uid1',
      },
    }

    await signTransaction(mockConfig as any, { tx: 'tx_test', innerTx: true })
    expect(mockConnector.signTransaction).toHaveBeenCalledWith('tx_test', {
      networkId: 'ae_uat',
      innerTx: true,
    })
  })
})
