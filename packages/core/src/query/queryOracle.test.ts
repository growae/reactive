import { describe, it, expect } from 'vitest'
import { queryOracleMutationOptions } from './queryOracle.js'

describe('queryOracleMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof queryOracleMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = queryOracleMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['queryOracle'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
