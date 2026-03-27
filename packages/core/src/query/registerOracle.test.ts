import { describe, expect, it } from 'vitest'
import { registerOracleMutationOptions } from './registerOracle'

describe('registerOracleMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof registerOracleMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = registerOracleMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['registerOracle'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
