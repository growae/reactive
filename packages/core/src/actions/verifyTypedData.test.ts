import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  hashTypedData: vi.fn().mockReturnValue(Buffer.from('mockhash', 'utf8')),
  verifySignature: vi.fn().mockReturnValue(true),
}))

import { verifyTypedData } from './verifyTypedData.js'

describe('verifyTypedData', () => {
  it('should be a function', () => {
    expect(typeof verifyTypedData).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(verifyTypedData.length).toBeGreaterThanOrEqual(1)
  })

  it('should return a boolean result', () => {
    const mockConfig = { state: { networkId: 'ae_uat' } }
    const result = verifyTypedData(mockConfig as any, {
      data: 'test',
      aci: {},
      signature: 'deadbeef',
      address: 'ak_test',
    })
    expect(typeof result).toBe('boolean')
  })

  it('should accept hex string signature', () => {
    const mockConfig = { state: { networkId: 'ae_uat' } }
    const result = verifyTypedData(mockConfig as any, {
      data: 'test',
      aci: {},
      signature: 'deadbeef',
      address: 'ak_test',
    })
    expect(result).toBe(true)
  })

  it('should accept Uint8Array signature', () => {
    const mockConfig = { state: { networkId: 'ae_uat' } }
    const result = verifyTypedData(mockConfig as any, {
      data: 'test',
      aci: {},
      signature: new Uint8Array([1, 2, 3]),
      address: 'ak_test',
    })
    expect(result).toBe(true)
  })

  it('should use empty domain object by default', async () => {
    const { hashTypedData } = await import('@aeternity/aepp-sdk')
    const mockConfig = { state: { networkId: 'ae_uat' } }

    verifyTypedData(mockConfig as any, {
      data: 'test',
      aci: { functions: [] },
      signature: 'abcd',
      address: 'ak_test',
    })

    expect(hashTypedData).toHaveBeenCalledWith('test', { functions: [] }, {})
  })
})
