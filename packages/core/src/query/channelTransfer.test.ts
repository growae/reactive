import { describe, expect, it } from 'vitest'
import { channelTransferMutationOptions } from './channelTransfer'

describe('channelTransferMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof channelTransferMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = channelTransferMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['channelTransfer'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
