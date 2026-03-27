import { describe, expect, it, vi } from 'vitest'
import { PreclaimNameNoAccountError, preclaimName } from './preclaimName.js'

describe('preclaimName', () => {
  it('should be a function', () => {
    expect(typeof preclaimName).toBe('function')
  })

  it('should throw PreclaimNameNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      preclaimName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow(PreclaimNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new PreclaimNameNoAccountError()
    expect(error.name).toBe('PreclaimNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new PreclaimNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
