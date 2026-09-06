import { describe, expect, it, vi } from 'vitest'
import { getOracleQueries } from './getOracleQueries.js'

describe('getOracleQueries', () => {
  it('should be a function', () => {
    expect(typeof getOracleQueries).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getOracleQueries.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      getOracleQueries(mockConfig as any, { oracleId: 'ok_test' }),
    ).rejects.toThrow()
  })

  it('should return oracle queries from node', async () => {
    const mockNode = {
      getOracleQueriesByPubkey: vi.fn().mockResolvedValue({
        oracleQueries: [
          {
            id: 'oq_1',
            senderId: 'ak_sender',
            oracleId: 'ok_test',
            query: 'what?',
            response: 'yes',
            fee: 100n,
            ttl: 200,
            responseTtl: { type: 'delta', value: 10 },
          },
        ],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getOracleQueries(mockConfig as any, {
      oracleId: 'ok_test',
    })
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('oq_1')
    expect(result[0]!.senderId).toBe('ak_sender')
    expect(result[0]!.fee).toBe('100')
    expect(result[0]!.responseTtl).toEqual({ type: 'delta', value: 10 })
  })

  it('should pass filter options to node', async () => {
    const mockNode = {
      getOracleQueriesByPubkey: vi.fn().mockResolvedValue({
        oracleQueries: [],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await getOracleQueries(mockConfig as any, {
      oracleId: 'ok_test',
      from: 'oq_start',
      limit: 10,
      type: 'open',
    })
    expect(mockNode.getOracleQueriesByPubkey).toHaveBeenCalledWith('ok_test', {
      from: 'oq_start',
      limit: 10,
      type: 'open',
    })
  })

  it('should handle undefined oracleQueries', async () => {
    const mockNode = {
      getOracleQueriesByPubkey: vi.fn().mockResolvedValue({}),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getOracleQueries(mockConfig as any, {
      oracleId: 'ok_test',
    })
    expect(result).toEqual([])
  })
})
