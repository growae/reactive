import { describe, expect, it, vi } from 'vitest'
import { waitForTransactionConfirm } from './waitForTransactionConfirm.js'

describe('waitForTransactionConfirm', () => {
  it('should be a function', () => {
    expect(typeof waitForTransactionConfirm).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(waitForTransactionConfirm.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      waitForTransactionConfirm(mockConfig as any, { hash: 'th_test' }),
    ).rejects.toThrow()
  })

  it('should throw if transaction is not yet mined', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({ blockHeight: -1 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransactionConfirm(mockConfig as any, { hash: 'th_test' }),
    ).rejects.toThrow(/not yet mined/)
  })

  it('should return height when confirmations are reached', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({ blockHeight: 10 }),
      getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 15 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await waitForTransactionConfirm(mockConfig as any, {
      hash: 'th_test',
      confirm: 3,
      interval: 1,
    })
    expect(result).toBe(15)
  })
})
