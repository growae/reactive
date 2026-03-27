import { describe, it, expect } from 'vitest'
import { verifyMessageMutationOptions } from './verifyMessage.js'

describe('verifyMessageMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof verifyMessageMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = verifyMessageMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['verifyMessage'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
