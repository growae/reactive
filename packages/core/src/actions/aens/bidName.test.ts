import { describe, expect, it, vi } from 'vitest'
import { BidNameNoAccountError, bidName } from './bidName'

describe('bidName', () => {
  it('should be a function', () => {
    expect(typeof bidName).toBe('function')
  })

  it('should throw BidNameNoAccountError without connected account', async () => {
    const mockConfig = {
      state: { current: null, connections: new Map() },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      bidName(mockConfig as any, { name: 'test.chain', nameFee: '100' }),
    ).rejects.toThrow(BidNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new BidNameNoAccountError()
    expect(error.name).toBe('BidNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new BidNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })
})
