import { describe, it, expect, vi } from 'vitest'
import { getBlock } from './getBlock.js'

describe('getBlock', () => {
  it('should be a function', () => {
    expect(typeof getBlock).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(getBlock.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => { throw new Error('No node') }),
      state: { networkId: 'ae_uat' },
    }
    await expect(getBlock(mockConfig as any, {})).rejects.toThrow()
  })

  it('should fetch block by hash', async () => {
    const blockData = {
      hash: 'kh_abc',
      height: 100,
      prevHash: 'kh_prev',
      prevKeyHash: 'kh_prevkey',
      time: 1234567890,
      miner: 'ak_miner',
      beneficiary: 'ak_ben',
      target: 42,
      nonce: 99,
    }
    const mockNode = {
      getKeyBlockByHash: vi.fn().mockResolvedValue(blockData),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getBlock(mockConfig as any, { hash: 'kh_abc' })
    expect(mockNode.getKeyBlockByHash).toHaveBeenCalledWith('kh_abc')
    expect(result.hash).toBe('kh_abc')
    expect(result.height).toBe(100)
  })

  it('should fetch block by height', async () => {
    const mockNode = {
      getKeyBlockByHeight: vi.fn().mockResolvedValue({
        hash: 'kh_abc',
        height: 50,
        prevHash: 'kh_prev',
        prevKeyHash: 'kh_prevkey',
        time: 1234567890,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getBlock(mockConfig as any, { height: 50 })
    expect(mockNode.getKeyBlockByHeight).toHaveBeenCalledWith(50)
    expect(result.height).toBe(50)
  })

  it('should fetch current block when no hash or height', async () => {
    const mockNode = {
      getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 200 }),
      getKeyBlockByHeight: vi.fn().mockResolvedValue({
        hash: 'kh_current',
        height: 200,
        prevHash: 'kh_prev',
        prevKeyHash: 'kh_prevkey',
        time: 1234567890,
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await getBlock(mockConfig as any, {})
    expect(mockNode.getCurrentKeyBlockHeight).toHaveBeenCalled()
    expect(mockNode.getKeyBlockByHeight).toHaveBeenCalledWith(200)
    expect(result.height).toBe(200)
  })
})
