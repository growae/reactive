import { describe, expect, it, vi } from 'vitest'
import { getContractEvents } from './getContractEvents'

describe('getContractEvents', () => {
  it('should be a function', () => {
    expect(typeof getContractEvents).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getContractEvents.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when getNode fails', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      getContractEvents(mockConfig as any, { address: 'ct_test' }),
    ).rejects.toThrow()
  })

  it('should return empty array when node has no getTransactionInfoByHash', async () => {
    const mockNode = {}
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getContractEvents(mockConfig as any, {
      address: 'ct_test',
    })
    expect(result).toEqual([])
  })
})
