import { describe, it, expect } from 'vitest'
import { transferFundsMutationOptions } from './transferFunds.js'

describe('transferFundsMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof transferFundsMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = transferFundsMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['transferFunds'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
