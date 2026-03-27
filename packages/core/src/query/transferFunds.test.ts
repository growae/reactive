import { describe, expect, it } from 'vitest'
import { transferFundsMutationOptions } from './transferFunds'

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
