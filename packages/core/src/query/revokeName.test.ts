import { describe, expect, it } from 'vitest'
import { revokeNameMutationOptions } from './revokeName'

describe('revokeNameMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof revokeNameMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = revokeNameMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['revokeName'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
