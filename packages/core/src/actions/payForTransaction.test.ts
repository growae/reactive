import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_TTL } from '../constants.js'
import { payForTransaction } from './payForTransaction.js'

describe('payForTransaction', () => {
  it('should be a function', () => {
    expect(typeof payForTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(payForTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when no connector is found', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    } as any

    await expect(
      payForTransaction(mockConfig, { innerTx: 'tx_inner' }),
    ).rejects.toThrow(/No connector found/)
  })

  it('should throw when connector has no accounts', async () => {
    const mockConnector = {
      getAccounts: vi.fn().mockResolvedValue([]),
    }
    const mockConfig = {
      state: {
        connections: new Map([['uid1', { connector: mockConnector }]]),
        current: 'uid1',
      },
    } as any

    await expect(
      payForTransaction(mockConfig, { innerTx: 'tx_inner' }),
    ).rejects.toThrow(/No account available/)
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
