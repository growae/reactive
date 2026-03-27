import { describe, expect, it } from 'vitest'
import { buildAuthTxHashMutationOptions } from './buildAuthTxHash.js'

describe('buildAuthTxHashMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof buildAuthTxHashMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = buildAuthTxHashMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['buildAuthTxHash'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
