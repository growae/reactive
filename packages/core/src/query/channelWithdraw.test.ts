import { describe, expect, it } from 'vitest'
import { channelWithdrawMutationOptions } from './channelWithdraw.js'

describe('channelWithdrawMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof channelWithdrawMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = channelWithdrawMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['channelWithdraw'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
