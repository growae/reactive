import { describe, expect, it, vi } from 'vitest'
import { ExtendOracleNoAccountError, extendOracle } from './extendOracle.js'

describe('extendOracle', () => {
  it('should be a function', () => {
    expect(typeof extendOracle).toBe('function')
  })

  it('should throw ExtendOracleNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null, connections: new Map() },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      extendOracle(mockConfig as any, {
        oracleId: 'ok_test',
        oracleTtl: { type: 'delta', value: 500 },
      }),
    ).rejects.toThrow(ExtendOracleNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new ExtendOracleNoAccountError()
    expect(error.name).toBe('ExtendOracleNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new ExtendOracleNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
