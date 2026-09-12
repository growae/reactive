import { describe, expect, it, vi } from 'vitest'
import { getMicroBlock } from './getMicroBlock.js'

describe('getMicroBlock', () => {
  it('should be a function', () => {
    expect(typeof getMicroBlock).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getMicroBlock.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      getMicroBlock(mockConfig as any, { hash: 'mh_test' }),
    ).rejects.toThrow()
  })

  it('should fetch micro block header and transactions', async () => {
    const headerData = {
      hash: 'mh_test',
      height: 100,
      pofHash: 'no_fraud',
      prevHash: 'mh_prev',
      prevKeyHash: 'kh_prev',
      stateHash: 'bs_state',
      time: 1234567890,
      txsHash: 'bx_txs',
      version: 5,
    }
    const txsData = {
      transactions: [{ hash: 'th_tx1' }, { hash: 'th_tx2' }],
    }
    const mockNode = {
      getMicroBlockHeaderByHash: vi.fn().mockResolvedValue(headerData),
      getMicroBlockTransactionsByHash: vi.fn().mockResolvedValue(txsData),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getMicroBlock(mockConfig as any, { hash: 'mh_test' })
    expect(mockNode.getMicroBlockHeaderByHash).toHaveBeenCalledWith('mh_test')
    expect(mockNode.getMicroBlockTransactionsByHash).toHaveBeenCalledWith(
      'mh_test',
    )
    expect(result.hash).toBe('mh_test')
    expect(result.transactions).toHaveLength(2)
    expect(result.version).toBe(5)
  })
})
