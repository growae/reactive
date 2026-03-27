import { describe, expect, it } from 'vitest'
import { createGeneralizedAccountMutationOptions } from './createGeneralizedAccount'

describe('createGeneralizedAccountMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof createGeneralizedAccountMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = createGeneralizedAccountMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['createGeneralizedAccount'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
