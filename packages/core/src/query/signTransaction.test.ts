import { describe, expect, it } from 'vitest'
import { signTransactionMutationOptions } from './signTransaction.js'

describe('signTransactionMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof signTransactionMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = signTransactionMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['signTransaction'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
