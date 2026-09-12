import { describe, expect, it } from 'vitest'
import { extendOracleMutationOptions } from './extendOracle.js'

describe('extendOracleMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof extendOracleMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = extendOracleMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['extendOracle'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
