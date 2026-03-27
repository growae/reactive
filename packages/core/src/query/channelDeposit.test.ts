import { describe, expect, it } from 'vitest'
import { channelDepositMutationOptions } from './channelDeposit'

describe('channelDepositMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof channelDepositMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = channelDepositMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['channelDeposit'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
