import { describe, expect, it } from 'vitest'
import { transferNameMutationOptions } from './transferName'

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
