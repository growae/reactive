import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  buildTxAsync: vi.fn(async () => 'tx_PAYING_FOR'),
  Tag: { PayingForTx: 30 },
}))

vi.mock('./sendTransaction.js', () => ({
  sendTransaction: vi.fn(async () => ({
    hash: 'th_1',
    rawTx: 'tx_PAYING_FOR',
  })),
}))

import { buildTxAsync } from '@aeternity/aepp-sdk'
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

  /**
   * `payForTransaction` carries the same shape `transferFunds` did: on the
   * explicit-`connector` path it took `getAccounts()[0]` as the payer, so a
   * user on a second account had the first one pay — and a `PayingForTx` names
   * the payer in the transaction itself, so it is the wrong account's balance
   * that is spent.
   */
  it('takes the payer from the active account, not the first of the list', async () => {
    const connector = {
      uid: 'uid1',
      getAccounts: vi.fn().mockResolvedValue(['ak_first', 'ak_second']),
    }
    const config = {
      getNodeClient: vi.fn(() => ({})),
      state: {
        networkId: 'ae_uat',
        connections: new Map([
          ['uid1', { connector, activeAccount: 'ak_second' }],
        ]),
        current: 'uid1',
      },
    } as any

    await payForTransaction(config, {
      innerTx: 'tx_inner',
      connector: connector as any,
    })

    expect(buildTxAsync).toHaveBeenCalledWith(
      expect.objectContaining({ payerId: 'ak_second' }),
    )
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
