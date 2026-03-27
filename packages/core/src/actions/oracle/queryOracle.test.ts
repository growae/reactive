import { describe, expect, it, vi } from 'vitest'
import { QueryOracleNoAccountError, queryOracle } from './queryOracle.js'

describe('queryOracle', () => {
  it('should be a function', () => {
    expect(typeof queryOracle).toBe('function')
  })

  it('should throw QueryOracleNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      queryOracle(mockConfig as any, {
        oracleId: 'ok_test',
        query: 'what is the weather?',
      }),
    ).rejects.toThrow(QueryOracleNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new QueryOracleNoAccountError()
    expect(error.name).toBe('QueryOracleNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new QueryOracleNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
