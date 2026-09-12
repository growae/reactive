import { describe, expect, it, vi } from 'vitest'
import { waitForTransaction } from './waitForTransaction.js'

describe('waitForTransaction', () => {
  it('should be a function', () => {
    expect(typeof waitForTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(waitForTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      waitForTransaction(mockConfig as any, { hash: 'th_test' }),
    ).rejects.toThrow()
  })

  it('should return immediately if transaction is already mined', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: 'mh_block',
        blockHeight: 100,
        tx: { type: 'SpendTx' },
      }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    const result = await waitForTransaction(mockConfig as any, {
      hash: 'th_test',
      interval: 10,
    })
    expect(result.hash).toBe('th_test')
    expect(result.blockHeight).toBe(100)
  })

  it('should throw on timeout', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: { ttl: 0 },
      }),
      getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 1 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransaction(mockConfig as any, {
        hash: 'th_test',
        timeout: 1,
        interval: 1,
      }),
    ).rejects.toThrow(/timed out/)
  })

  it('should throw when max blocks exceeded', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: {},
      }),
      getCurrentKeyBlockHeight: vi
        .fn()
        .mockResolvedValueOnce({ height: 100 })
        .mockResolvedValueOnce({ height: 100 })
        .mockResolvedValue({ height: 200 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransaction(mockConfig as any, {
        hash: 'th_test',
        blocks: 5,
        interval: 1,
      }),
    ).rejects.toThrow(/not mined within/)
  })
  it('terminates on the default call when the transaction carries a ttl', async () => {
    // The defect: every action in this package builds with `DEFAULT_TTL`, so
    // this — no `timeout`, no `blocks` — was the branch that polled forever.
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: { ttl: 400 },
      }),
      getCurrentKeyBlockHeight: vi
        .fn()
        .mockResolvedValueOnce({ height: 100 })
        .mockResolvedValue({ height: 200 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransaction(mockConfig as any, { hash: 'th_test', interval: 1 }),
    ).rejects.toThrow(/not mined within 5 blocks/)
  })

  it('stops at the ttl height when it is nearer than the blocks bound', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: { ttl: 102 },
      }),
      getCurrentKeyBlockHeight: vi
        .fn()
        .mockResolvedValueOnce({ height: 100 })
        .mockResolvedValue({ height: 102 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    // 100 + 5 blocks would be 105, but the transaction dies at 102.
    await expect(
      waitForTransaction(mockConfig as any, { hash: 'th_test', interval: 1 }),
    ).rejects.toThrow(/expired unmined: its ttl height 102 has passed/)
  })

  it('does not let the default blocks bound cut an explicit timeout short', async () => {
    // The caller named their own bound. The chain is far past `height + 5`, so
    // applying the default `blocks` here would end the wait early and change a
    // path that already terminates.
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: { ttl: 0 },
      }),
      getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 100_000 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransaction(mockConfig as any, {
        hash: 'th_test',
        timeout: 60,
        interval: 5,
      }),
    ).rejects.toThrow(/timed out/)
    expect(mockNode.getCurrentKeyBlockHeight).not.toHaveBeenCalled()
  })

  it('applies both bounds when the caller passes both', async () => {
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: { ttl: 0 },
      }),
      getCurrentKeyBlockHeight: vi
        .fn()
        .mockResolvedValueOnce({ height: 100 })
        .mockResolvedValue({ height: 200 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    // `blocks` is explicit here, so it bounds the wait and fires first.
    await expect(
      waitForTransaction(mockConfig as any, {
        hash: 'th_test',
        blocks: 5,
        timeout: 60_000,
        interval: 1,
      }),
    ).rejects.toThrow(/not mined within 5 blocks/)
  })

  it('stops at the ttl height even when a timeout is the caller bound', async () => {
    // A passed ttl is terminal, not a timeout: the transaction can never be
    // mined, so waiting out the remaining timeout would tell the caller nothing.
    const mockNode = {
      getTransactionByHash: vi.fn().mockResolvedValue({
        hash: 'th_test',
        blockHash: '',
        blockHeight: -1,
        tx: { ttl: 100 },
      }),
      getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 100 }),
    }
    const mockConfig = {
      getNodeClient: vi.fn(() => mockNode),
      state: { networkId: 'ae_uat' },
    }

    await expect(
      waitForTransaction(mockConfig as any, {
        hash: 'th_test',
        timeout: 60_000,
        interval: 1,
      }),
    ).rejects.toThrow(/expired unmined: its ttl height 100 has passed/)
  })
})
