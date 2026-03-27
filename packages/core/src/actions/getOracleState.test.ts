import { describe, expect, it, vi } from 'vitest'
import { getOracleState } from './getOracleState.js'

describe('getOracleState', () => {
  it('should be a function', () => {
    expect(typeof getOracleState).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getOracleState.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      getOracleState(mockConfig as any, { oracleId: 'ok_test' }),
    ).rejects.toThrow()
  })

  it('should return oracle state from node', async () => {
    const mockNode = {
      getOracleByPubkey: vi.fn().mockResolvedValue({
        id: 'ok_test',
        queryFormat: 'string',
        responseFormat: 'string',
        queryFee: 1000n,
        ttl: 500,
        abiVersion: 0,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getOracleState(mockConfig as any, {
      oracleId: 'ok_test',
    })
    expect(mockNode.getOracleByPubkey).toHaveBeenCalledWith('ok_test')
    expect(result.id).toBe('ok_test')
    expect(result.queryFormat).toBe('string')
    expect(result.responseFormat).toBe('string')
    expect(result.queryFee).toBe('1000')
    expect(result.ttl).toBe(500)
    expect(result.abiVersion).toBe(0)
  })
})
