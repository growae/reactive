import { describe, expect, it } from 'vitest'
import { OpenChannelNoAccountError, openChannel } from './openChannel'

describe('openChannel', () => {
  it('should be a function', () => {
    expect(typeof openChannel).toBe('function')
  })

  it('should have correct error name', () => {
    const error = new OpenChannelNoAccountError()
    expect(error.name).toBe('OpenChannelNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new OpenChannelNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
