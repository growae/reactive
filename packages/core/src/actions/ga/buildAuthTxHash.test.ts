import { describe, expect, it, vi } from 'vitest'

vi.mock('@aeternity/aepp-sdk', () => ({
  buildAuthTxHash: vi.fn().mockResolvedValue(Buffer.from('mockhash')),
}))

import { buildAuthTxHash } from './buildAuthTxHash.js'

describe('buildAuthTxHash', () => {
  it('should be a function', () => {
    expect(typeof buildAuthTxHash).toBe('function')
  })

  it('should call sdk.buildAuthTxHash with tx and node', async () => {
    const mockNode = {}
    const mockConfig = { getNodeClient: vi.fn().mockReturnValue(mockNode) }

    const result = await buildAuthTxHash(mockConfig as any, {
      tx: 'tx_encoded',
    })

    expect(result.txHash).toBeInstanceOf(Buffer)

    const sdk = await import('@aeternity/aepp-sdk')
    expect(sdk.buildAuthTxHash).toHaveBeenCalledWith('tx_encoded', {
      onNode: mockNode,
    })
  })
})
