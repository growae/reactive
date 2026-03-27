import { describe, expect, it } from 'vitest'
import { buildTransactionMutationOptions } from './buildTransaction.js'

describe('buildTransactionMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof buildTransactionMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = buildTransactionMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['buildTransaction'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
