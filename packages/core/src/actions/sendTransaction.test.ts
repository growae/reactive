import { describe, it, expect, vi } from 'vitest'
import { sendTransaction } from './sendTransaction.js'

describe('sendTransaction', () => {
  it('should be a function', () => {
    expect(typeof sendTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(sendTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => { throw new Error('No node') }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      sendTransaction(mockConfig as any, { tx: 'tx_encoded' }),
    ).rejects.toThrow()
  })

  it('should post transaction and return hash and rawTx', async () => {
    const mockNode = {
      postTransaction: vi.fn().mockResolvedValue({ txHash: 'th_result' }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await sendTransaction(mockConfig as any, { tx: 'tx_encoded' })
    expect(mockNode.postTransaction).toHaveBeenCalledWith({ tx: 'tx_encoded' })
    expect(result.hash).toBe('th_result')
    expect(result.rawTx).toBe('tx_encoded')
  })
})
