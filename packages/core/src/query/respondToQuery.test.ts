import { describe, expect, it } from 'vitest'
import { respondToQueryMutationOptions } from './respondToQuery'

describe('respondToQueryMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof respondToQueryMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = respondToQueryMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['respondToQuery'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
