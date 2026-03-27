import { describe, expect, it, vi } from 'vitest'
import { simulateContract } from './simulateContract.js'

describe('simulateContract', () => {
  it('should be a function', () => {
    expect(typeof simulateContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(simulateContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when getNode fails', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { current: undefined },
    }

    await expect(
      simulateContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'get',
      }),
    ).rejects.toThrow()
  })
})
