import { describe, it, expect, vi } from 'vitest'
import { getTransaction } from './getTransaction.js'

describe('getTransaction', () => {
  it('should be a function', () => {
    expect(typeof getTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => { throw new Error('No node') }),
      state: { networkId: 'ae_uat' },
    }
    await expect(getTransaction(mockConfig as any, { hash: 'th_test' })).rejects.toThrow()
  })

  it('should return transaction details from node', async () => {
    const txData = {
      hash: 'th_test',
      blockHash: 'mh_block',
      blockHeight: 42,
      tx: { type: 'SpendTx', amount: 100 },
      signatures: ['sg_abc'],
    }
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue(txData),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getTransaction(mockConfig as any, { hash: 'th_test' })
    expect(mockNode.getTransactionByHash).toHaveBeenCalledWith('th_test')
    expect(result.hash).toBe('th_test')
    expect(result.blockHash).toBe('mh_block')
    expect(result.blockHeight).toBe(42)
    expect(result.signatures).toEqual(['sg_abc'])
  })

  it('should default signatures to empty array', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: 'mh_block',
        blockHeight: 10,
        tx: {},
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getTransaction(mockConfig as any, { hash: 'th_test' })
    expect(result.signatures).toEqual([])
  })
})
