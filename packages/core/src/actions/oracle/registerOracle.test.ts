import { describe, expect, it, vi } from 'vitest'
import {
  RegisterOracleNoAccountError,
  registerOracle,
} from './registerOracle.js'

describe('registerOracle', () => {
  it('should be a function', () => {
    expect(typeof registerOracle).toBe('function')
  })

  it('should throw RegisterOracleNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null, connections: new Map() },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      registerOracle(mockConfig as any, {
        queryFormat: 'string',
        responseFormat: 'string',
      }),
    ).rejects.toThrow(RegisterOracleNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new RegisterOracleNoAccountError()
    expect(error.name).toBe('RegisterOracleNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new RegisterOracleNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
