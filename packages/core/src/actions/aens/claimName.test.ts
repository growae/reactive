import { describe, expect, it, vi } from 'vitest'
import { ClaimNameNoAccountError, claimName } from './claimName'

describe('claimName', () => {
  it('should be a function', () => {
    expect(typeof claimName).toBe('function')
  })

  it('should throw ClaimNameNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null, connections: new Map() },
      getNodeClient: vi.fn().mockReturnValue({}),
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
