import { describe, expect, it } from 'vitest'
import { closeChannelMutationOptions } from './closeChannel'

describe('closeChannelMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof closeChannelMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = closeChannelMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['closeChannel'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
