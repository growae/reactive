import { describe, it, expect } from 'vitest'
import { channelTransferMutationOptions } from './channelTransfer.js'

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
