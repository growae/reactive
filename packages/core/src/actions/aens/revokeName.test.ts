import { describe, expect, it, vi } from 'vitest'
import { RevokeNameNoAccountError, revokeName } from './revokeName.js'

describe('revokeName', () => {
  it('should be a function', () => {
    expect(typeof revokeName).toBe('function')
  })

  it('should throw RevokeNameNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      revokeName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow(RevokeNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new RevokeNameNoAccountError()
    expect(error.name).toBe('RevokeNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new RevokeNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
