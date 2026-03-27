import { describe, it, expect, vi } from 'vitest'
import { waitForTransaction } from './waitForTransaction.js'

describe('waitForTransaction', () => {
  it('should be a function', () => {
    expect(typeof waitForTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(waitForTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => { throw new Error('No node') }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      waitForTransaction(mockConfig as any, { hash: 'th_test' }),
    ).rejects.toThrow()
  })

  it('should return immediately if transaction is already mined', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: 'mh_block',
        blockHeight: 100,
        tx: { type: 'SpendTx' },
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await waitForTransaction(mockConfig as any, {
      hash: 'th_test',
      interval: 10,
    })
    expect(result.hash).toBe('th_test')
    expect(result.blockHeight).toBe(100)
  })

  it('should throw on timeout', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: { ttl: 0 },
      }),
      getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 1 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransaction(mockConfig as any, {
        hash: 'th_test',
        timeout: 1,
        interval: 1,
      }),
    ).rejects.toThrow(/timed out/)
  })

  it('should throw when max blocks exceeded', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: {},
      }),
      getCurrentKeyBlockHeight: vi.fn()
        .mockResolvedValueOnce({ height: 100 })
        .mockResolvedValueOnce({ height: 100 })
        .mockResolvedValue({ height: 200 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransaction(mockConfig as any, {
        hash: 'th_test',
        blocks: 5,
        interval: 1,
      }),
    ).rejects.toThrow(/not mined within/)
  })
})
