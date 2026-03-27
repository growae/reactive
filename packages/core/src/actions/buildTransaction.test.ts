import { describe, it, expect, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  buildTxAsync: vi.fn().mockResolvedValue('tx_encoded_build'),
  Tag: { SpendTx: 12, ContractCallTx: 43 },
}))

import { buildTransaction } from './buildTransaction.js'
import { DEFAULT_TTL } from '../constants.js'

describe('buildTransaction', () => {
  it('should be a function', () => {
    expect(typeof buildTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(buildTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => { throw new Error('No node') }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      buildTransaction(mockConfig as any, { tag: 12 as any }),
    ).rejects.toThrow()
  })

  it('should build transaction using SDK buildTxAsync', async () => {
    const { buildTxAsync } = await import('@aeternity/aepp-sdk')
    const mockNode = {}
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await buildTransaction(mockConfig as any, {
      tag: 12 as any,
      senderId: 'ak_sender',
      recipientId: 'ak_recipient',
      amount: '100',
    })

    expect(result).toBe('tx_encoded_build')
    expect(buildTxAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 12,
        senderId: 'ak_sender',
        recipientId: 'ak_recipient',
        amount: '100',
        onNode: mockNode,
      }),
    )
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
