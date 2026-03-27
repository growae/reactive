import { describe, expect, it, vi } from 'vitest'
import { TransferNameNoAccountError, transferName } from './transferName'

describe('transferName', () => {
  it('should be a function', () => {
    expect(typeof transferName).toBe('function')
  })

  it('should throw TransferNameNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null, connections: new Map() },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      transferName(mockConfig as any, {
        name: 'test.chain',
        recipient: 'ak_recipient',
      }),
    ).rejects.toThrow(TransferNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new TransferNameNoAccountError()
    expect(error.name).toBe('TransferNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new TransferNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
