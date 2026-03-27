import { describe, expect, it } from 'vitest'
import { verifyTypedDataMutationOptions } from './verifyTypedData'

describe('verifyTypedDataMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof verifyTypedDataMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = verifyTypedDataMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['verifyTypedData'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
