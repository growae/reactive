import { describe, it, expect, vi } from 'vitest'
import { claimName, ClaimNameNoAccountError } from './claimName.js'

describe('claimName', () => {
  it('should be a function', () => {
    expect(typeof claimName).toBe('function')
  })

  it('should throw ClaimNameNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      claimName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow(ClaimNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new ClaimNameNoAccountError()
    expect(error.name).toBe('ClaimNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new ClaimNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
