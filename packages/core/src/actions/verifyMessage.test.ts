import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  verifyMessageSignature: vi.fn().mockReturnValue(true),
}))

import { verifyMessage } from './verifyMessage.js'

describe('verifyMessage', () => {
  it('should be a function', () => {
    expect(typeof verifyMessage).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(verifyMessage.length).toBeGreaterThanOrEqual(1)
  })

  it('should return a boolean result', () => {
    const mockConfig = { state: { networkId: 'ae_uat' } }
    const result = verifyMessage(mockConfig as any, {
      message: 'hello',
      signature: 'abcdef',
      address: 'ak_test',
    })
    expect(typeof result).toBe('boolean')
  })

  it('should accept hex string signature', () => {
    const mockConfig = { state: { networkId: 'ae_uat' } }
    const result = verifyMessage(mockConfig as any, {
      message: 'hello',
      signature: 'deadbeef',
      address: 'ak_test',
    })
    expect(result).toBe(true)
  })

  it('should accept Uint8Array signature', () => {
    const mockConfig = { state: { networkId: 'ae_uat' } }
    const result = verifyMessage(mockConfig as any, {
      message: 'hello',
      signature: new Uint8Array([1, 2, 3]),
      address: 'ak_test',
    })
    expect(result).toBe(true)
  })
})
