import { describe, expect, it } from 'vitest'
import { payForTransactionMutationOptions } from './payForTransaction.js'

describe('payForTransactionMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof payForTransactionMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = payForTransactionMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['payForTransaction'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
