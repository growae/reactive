import { describe, expect, it } from 'vitest'
import { openChannelMutationOptions } from './openChannel.js'

describe('openChannelMutationOptions', () => {
  it('should be a function', () => {
    expect(typeof openChannelMutationOptions).toBe('function')
  })

  it('should return mutation options with correct key', () => {
    const mockConfig = {} as any
    const options = openChannelMutationOptions(mockConfig)
    expect(options.mutationKey).toEqual(['openChannel'])
    expect(typeof options.mutationFn).toBe('function')
  })
})
