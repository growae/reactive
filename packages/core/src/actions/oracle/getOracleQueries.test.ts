import { describe, expect, it, vi } from 'vitest'
import { getOracleQueries } from './getOracleQueries'

describe('getOracleQueries', () => {
  it('should be a function', () => {
    expect(typeof getOracleQueries).toBe('function')
  })

  it('should call node.getOracleQueriesByPubkey and return mapped entries', async () => {
    const mockQueries = {
      oracleQueries: [
        {
          id: 'oq_1',
          senderId: 'ak_sender',
          query: 'question',
          response: 'answer',
          ttl: 100,
          responseTtl: { type: 'delta', value: 50 },
          fee: 200,
          extra: 'ignored',
        },
      ],
    }
    const mockNode = {
      getOracleQueriesByPubkey: vi.fn().mockResolvedValue(mockQueries),
    }
    const mockConfig = { getNodeClient: vi.fn().mockReturnValue(mockNode) }

    const result = await getOracleQueries(mockConfig as any, {
      oracleId: 'ok_oracle1',
    })

    expect(mockNode.getOracleQueriesByPubkey).toHaveBeenCalledWith('ok_oracle1')
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('oq_1')
    expect(result[0]!.senderId).toBe('ak_sender')
    expect(result[0]!.fee).toBe('200')
  })

  it('should return empty array when no queries', async () => {
    const mockNode = {
      getOracleQueriesByPubkey: vi
        .fn()
        .mockResolvedValue({ oracleQueries: [] }),
    }
    const mockConfig = { getNodeClient: vi.fn().mockReturnValue(mockNode) }

    const result = await getOracleQueries(mockConfig as any, {
      oracleId: 'ok_oracle1',
    })

    expect(result).toEqual([])
  })
})
