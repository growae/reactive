import { describe, expect, it, vi } from 'vitest'
import { estimateGas } from './estimateGas'

describe('estimateGas', () => {
  it('should be a function', () => {
    expect(typeof estimateGas).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(estimateGas.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      estimateGas(mockConfig as any, {
        tx: 'tx_test',
        accountAddress: 'ak_test',
      }),
    ).rejects.toThrow()
  })

  it('should return gas estimation from dry run', async () => {
    const mockNode = {
      protectedDryRunTxs: vi.fn().mockResolvedValue({
        results: [
          {
            result: 'ok',
            callObj: { gasUsed: 5000, gasPrice: 1000000000n },
          },
        ],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await estimateGas(mockConfig as any, {
      tx: 'tx_test',
      accountAddress: 'ak_test',
    })
    expect(result.gasUsed).toBe(5000)
    expect(result.result).toBe('ok')
  })

  it('should throw when dry run fails', async () => {
    const mockNode = {
      protectedDryRunTxs: vi.fn().mockResolvedValue({
        results: [{ result: 'error', reason: 'out of gas' }],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      estimateGas(mockConfig as any, {
        tx: 'tx_test',
        accountAddress: 'ak_test',
      }),
    ).rejects.toThrow(/Dry-run failed/)
  })

  it('should resolve numeric top to block hash', async () => {
    const mockNode = {
      getKeyBlockByHeight: vi.fn().mockResolvedValue({ hash: 'kh_at50' }),
      protectedDryRunTxs: vi.fn().mockResolvedValue({
        results: [{ result: 'ok', callObj: { gasUsed: 100, gasPrice: 0n } }],
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await estimateGas(mockConfig as any, {
      tx: 'tx_test',
      accountAddress: 'ak_test',
      top: 50,
    })
    expect(mockNode.getKeyBlockByHeight).toHaveBeenCalledWith(50)
    expect(mockNode.protectedDryRunTxs).toHaveBeenCalledWith(
      expect.objectContaining({ top: 'kh_at50' }),
    )
  })
})
