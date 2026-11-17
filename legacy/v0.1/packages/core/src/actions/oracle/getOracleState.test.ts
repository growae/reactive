import { describe, expect, it, vi } from 'vitest'
import { getOracleState } from './getOracleState.js'

describe('getOracleState', () => {
  it('should be a function', () => {
    expect(typeof getOracleState).toBe('function')
  })

  it('should call node.getOracleByPubkey and return mapped result', async () => {
    const mockResult = {
      id: 'ok_oracle1',
      queryFormat: 'string',
      responseFormat: 'string',
      queryFee: 1000,
      ttl: 50000,
      abiVersion: 0,
    }
    const mockNode = {
      getOracleByPubkey: vi.fn().mockResolvedValue(mockResult),
    }
    const mockConfig = { getNodeClient: vi.fn().mockReturnValue(mockNode) }

    const result = await getOracleState(mockConfig as any, {
      oracleId: 'ok_oracle1',
    })

    expect(mockNode.getOracleByPubkey).toHaveBeenCalledWith('ok_oracle1')
    expect(result.id).toBe('ok_oracle1')
    expect(result.queryFormat).toBe('string')
    expect(result.responseFormat).toBe('string')
    expect(result.queryFee).toBe('1000')
    expect(result.ttl).toBe(50000)
    expect(result.abiVersion).toBe(0)
  })
})
