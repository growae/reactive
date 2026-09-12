import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_WAIT_TIMEOUT } from '../constants.js'
import { sendTransaction } from './sendTransaction.js'
import { waitForTransaction } from './waitForTransaction.js'

vi.mock('./waitForTransaction.js', () => ({
  waitForTransaction: vi.fn(async () => ({
    hash: 'th_result',
    blockHash: 'kh_1',
    blockHeight: 42,
    tx: { type: 'SpendTx' },
  })),
}))

function mockSetup() {
  const postTransaction = vi.fn(async () => ({ txHash: 'th_result' }))
  const node = { postTransaction }
  const config = {
    getNodeClient: vi.fn(() => node),
    state: { networkId: 'ae_uat' },
  } as any
  return { config, node, postTransaction }
}

describe('sendTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be a function', () => {
    expect(typeof sendTransaction).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(sendTransaction.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw without a valid node', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { networkId: 'ae_uat' },
    }
    await expect(
      sendTransaction(mockConfig as any, { tx: 'tx_encoded' }),
    ).rejects.toThrow()
  })

  it('should post transaction and return hash and rawTx', async () => {
    const { config, postTransaction } = mockSetup()

    const result = await sendTransaction(config, { tx: 'tx_encoded' })

    expect(postTransaction).toHaveBeenCalledWith({ tx: 'tx_encoded' })
    expect(result.hash).toBe('th_result')
    expect(result.rawTx).toBe('tx_encoded')
  })

  it('should not wait when waitMined is not set', async () => {
    const { config } = mockSetup()

    const result = await sendTransaction(config, { tx: 'tx_encoded' })

    expect(waitForTransaction).not.toHaveBeenCalled()
    expect(result).toEqual({ hash: 'th_result', rawTx: 'tx_encoded' })
  })

  it('should bound the wait with the default timeout when waitMined is true', async () => {
    const { config } = mockSetup()

    await sendTransaction(config, { tx: 'tx_encoded', waitMined: true })

    expect(waitForTransaction).toHaveBeenCalledWith(config, {
      hash: 'th_result',
      networkId: undefined,
      timeout: DEFAULT_WAIT_TIMEOUT,
    })
  })

  it('should forward an explicit timeout', async () => {
    const { config } = mockSetup()

    await sendTransaction(config, {
      tx: 'tx_encoded',
      networkId: 'ae_uat',
      waitMined: true,
      timeout: 1234,
    })

    expect(waitForTransaction).toHaveBeenCalledWith(config, {
      hash: 'th_result',
      networkId: 'ae_uat',
      timeout: 1234,
    })
  })

  it('should return the mined fields when waitMined is true', async () => {
    const { config } = mockSetup()

    const result = await sendTransaction(config, {
      tx: 'tx_encoded',
      waitMined: true,
    })

    expect(result).toEqual({
      hash: 'th_result',
      rawTx: 'tx_encoded',
      blockHash: 'kh_1',
      blockHeight: 42,
      tx: { type: 'SpendTx' },
    })
  })
})
