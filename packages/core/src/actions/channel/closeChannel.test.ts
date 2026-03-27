import { describe, it, expect } from 'vitest'
import { closeChannel, CloseChannelError } from './closeChannel.js'

describe('closeChannel', () => {
  it('should be a function', () => {
    expect(typeof closeChannel).toBe('function')
  })

  it('should throw CloseChannelError when channel.shutdown fails', async () => {
    const mockChannel = {
      shutdown: async () => {
        throw new Error('shutdown failed')
      },
    }
    const mockConfig = {} as any

    await expect(
      closeChannel(mockConfig, { channel: mockChannel, sign: async (tx: string) => tx }),
    ).rejects.toThrow(CloseChannelError)
  })

  it('should have correct error name', () => {
    const error = new CloseChannelError({ message: 'test' })
    expect(error.name).toBe('CloseChannelError')
  })

  it('should include message in error', () => {
    const error = new CloseChannelError({ message: 'something broke' })
    expect(error.message).toContain('something broke')
  })
})
