import { describe, expect, it, vi } from 'vitest'
import { readContracts } from './readContracts.js'

vi.mock('./readContract.js', () => ({
  readContract: vi.fn().mockResolvedValue({
    decodedResult: 'mock_result',
    hash: 'th_test',
    rawTx: 'tx_raw',
  }),
}))

describe('readContracts', () => {
  it('should be a function', () => {
    expect(typeof readContracts).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(readContracts.length).toBeGreaterThanOrEqual(1)
  })

  it('should call readContract for each contract in the list', async () => {
    const { readContract } = await import('./readContract.js')
    const mockConfig = {} as any

    const contracts = [
      { address: 'ct_1', aci: {}, method: 'get1' },
      { address: 'ct_2', aci: {}, method: 'get2' },
    ]

    const results = await readContracts(mockConfig, { contracts })
    expect(readContract).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(2)
  })

  it('should return empty array for empty contracts list', async () => {
    const mockConfig = {} as any
    const results = await readContracts(mockConfig, { contracts: [] })
    expect(results).toEqual([])
  })
})
