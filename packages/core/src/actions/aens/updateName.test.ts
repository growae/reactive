import { describe, it, expect, vi } from 'vitest'
import { updateName, UpdateNameNoAccountError } from './updateName.js'

describe('updateName', () => {
  it('should be a function', () => {
    expect(typeof updateName).toBe('function')
  })

  it('should throw UpdateNameNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null },
      getNode: vi.fn().mockReturnValue({}),
    }
    await expect(
      updateName(mockConfig as any, {
        name: 'test.chain',
        pointers: [{ key: 'account_pubkey', id: 'ak_test' }],
      }),
    ).rejects.toThrow(UpdateNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new UpdateNameNoAccountError()
    expect(error.name).toBe('UpdateNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new UpdateNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
