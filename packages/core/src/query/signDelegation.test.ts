import { describe, it, expect } from 'vitest'
import { signDelegationMutationOptions } from './signDelegation.js'

describe('signDelegationMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof signDelegationMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = signDelegationMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['signDelegation'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
