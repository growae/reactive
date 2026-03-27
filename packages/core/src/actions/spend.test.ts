import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockNode } = vi.hoisted(() => ({
  mockNode: {
    getAccountByPubkey: vi.fn(),
    postTransaction: vi.fn(),
  },
}))

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => mockNode),
  buildTx: vi.fn().mockReturnValue('tx_encoded_spend'),
  Tag: { SpendTx: 12 },
}))

import { buildTx } from '@aeternity/aepp-sdk'
import { mock } from '../connectors/mock'
import { createConfig } from '../createConfig'
import { testnet } from '../types/network'
import { connect } from './connect'
import { spend } from './spend'

const TEST_ACCOUNTS = [
  'ak_2swhLkgBPeeADxVTABy7tt6d2HgBQFnGJELkBUMY4FUa8RVLM',
] as const

function createTestConfig() {
  return createConfig({
    networks: [testnet],
    connectors: [mock({ accounts: [...TEST_ACCOUNTS] })],
    storage: null,
  })
}

describe('spend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNode.getAccountByPubkey.mockResolvedValue({
      balance: '10000000000000000000',
      nonce: 5,
    })
    mockNode.postTransaction.mockResolvedValue({
      txHash: 'th_mockTxHash123',
    })
  })

  it('should send a spend transaction', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    const result = await spend(config, {
      recipientId: 'ak_recipientAddress',
      amount: 1000000000000000000n,
    })

    expect(result.hash).toBe('th_mockTxHash123')
    expect(result.rawTx).toBeDefined()
  })

  it('should throw when no account is connected', async () => {
    const config = createTestConfig()
    await expect(
      spend(config, { recipientId: 'ak_test', amount: 100n }),
    ).rejects.toThrow('No connected account')
  })

  it('should call getAccountByPubkey with sender address', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await spend(config, {
      recipientId: 'ak_recipient',
      amount: 100n,
    })

    expect(mockNode.getAccountByPubkey).toHaveBeenCalledWith(TEST_ACCOUNTS[0])
  })

  it('should post the signed transaction', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await spend(config, {
      recipientId: 'ak_recipient',
      amount: 100n,
    })

    expect(mockNode.postTransaction).toHaveBeenCalledWith({
      tx: 'signed_tx_encoded_spend',
    })
  })

  it('should use custom nonce when provided', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await spend(config, {
      recipientId: 'ak_recipient',
      amount: 100n,
      options: { nonce: 42 },
    })

    expect(buildTx).toHaveBeenCalledWith(expect.objectContaining({ nonce: 42 }))
  })

  it('should auto-increment nonce from account info', async () => {
    mockNode.getAccountByPubkey.mockResolvedValue({
      balance: '10000000000000000000',
      nonce: 10,
    })

    const config = createTestConfig()
    const connector = config.connectors[0]!
    await connect(config, { connector })

    await spend(config, {
      recipientId: 'ak_recipient',
      amount: 100n,
    })

    expect(buildTx).toHaveBeenCalledWith(expect.objectContaining({ nonce: 11 }))
  })
})
