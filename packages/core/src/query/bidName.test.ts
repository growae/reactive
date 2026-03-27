import { describe, expect, it } from 'vitest'
import { bidNameMutationOptions } from './bidName'

describe('bidNameMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof bidNameMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = bidNameMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['bidName'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
