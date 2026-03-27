import { describe, it, expect } from 'vitest'
import { transferNameMutationOptions } from './transferName.js'

describe('transferNameMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof transferNameMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = transferNameMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['transferName'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
