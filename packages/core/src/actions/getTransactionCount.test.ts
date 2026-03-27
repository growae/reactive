import { describe, expect, it, vi } from 'vitest'
import { getTransactionCount } from './getTransactionCount'

describe('getTransactionCount', () => {
  it('should be a function', () => {
    expect(typeof getTransactionCount).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getTransactionCount.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      getTransactionCount(mockConfig as any, { address: 'ak_test' }),
    ).rejects.toThrow()
  })

  it('should return the next nonce from node', async () => {
    const mockNode = {
      getAccountNextNonce: vi.fn().mockResolvedValue({ nextNonce: 7 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getTransactionCount(mockConfig as any, {
      address: 'ak_test',
    })
    expect(mockNode.getAccountNextNonce).toHaveBeenCalledWith('ak_test')
    expect(result).toBe(7)
  })
})
