import { describe, expect, it, vi } from 'vitest'
import { callContract } from './callContract'
import { readContract } from './readContract'

vi.mock('./callContract.js', () => ({
  callContract: vi.fn().mockResolvedValue({
    decodedResult: 42,
    hash: 'th_test',
    rawTx: 'tx_raw',
  }),
}))

describe('readContract', () => {
  it('should be a function', () => {
    expect(typeof readContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(readContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should delegate to callContract with callStatic: true', async () => {
    const mockConfig = {} as any

    await readContract(mockConfig, {
      address: 'ct_test',
      aci: {},
      method: 'getValue',
    })

    expect(callContract).toHaveBeenCalledWith(mockConfig, {
      address: 'ct_test',
      aci: {},
      method: 'getValue',
      options: { callStatic: true },
    })
  })

  it('should merge user options with callStatic', async () => {
    const mockConfig = {} as any

    await readContract(mockConfig, {
      address: 'ct_test',
      aci: {},
      method: 'getValue',
      options: { gasLimit: 5000 },
    })

    expect(callContract).toHaveBeenCalledWith(mockConfig, {
      address: 'ct_test',
      aci: {},
      method: 'getValue',
      options: { gasLimit: 5000, callStatic: true },
    })
  })
})
