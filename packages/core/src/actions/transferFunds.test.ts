import { buildTxAsync } from '@aeternity/aepp-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TTL } from '../constants.js'
import { transferFunds } from './transferFunds.js'

vi.mock('@aeternity/aepp-sdk', () => ({
  buildTxAsync: vi.fn(async () => 'tx_UNSIGNED'),
  unpackTx: vi.fn(() => ({ fee: '1000' })),
  Tag: { SpendTx: 12 },
}))

/**
 * A connector that signs to a value the built transaction can never be
 * mistaken for, so `postTransaction` receiving `tx_UNSIGNED` is a failure the
 * assertion names rather than a silent pass.
 */
function mockSetup() {
  const signTransaction = vi.fn(async () => 'tx_SIGNED')
  const postTransaction = vi.fn(async () => ({ txHash: 'th_1' }))
  const getTransactionByHash = vi.fn(async () => ({
    hash: 'th_1',
    blockHash: 'kh_1',
    blockHeight: 42,
    tx: { type: 'SpendTx' },
  }))
  const node = {
    postTransaction,
    getTransactionByHash,
    getAccountByPubkey: vi.fn(async () => ({
      balance: '10000000000000000000',
      nonce: 1,
    })),
    getCurrentKeyBlockHeight: vi.fn(async () => ({ height: 100 })),
  }
  const connector = {
    uid: 'c1',
    signTransaction,
    getAccounts: vi.fn(async () => ['ak_sender']),
  }
  const config = {
    getNodeClient: vi.fn(() => node),
    state: {
      networkId: 'ae_uat',
      current: 'c1',
      connections: new Map([['c1', { connector, activeAccount: 'ak_sender' }]]),
    },
  } as any

  return { config, connector, node, postTransaction, signTransaction }
}

/**
 * The same connector, with a second account and the user on it.
 *
 * On the explicit-`connector` path the action used `getAccounts()[0]`, which
 * is the account the connector signs with — so this never produced the node
 * signature error, it produced something quieter: a transfer out of the first
 * account, sized against the first account's balance, correctly signed, while
 * the user had selected the second. Nothing reports it.
 */
function multiAccountSetup() {
  const setup = mockSetup()
  setup.connector.getAccounts = vi.fn(async () => ['ak_first', 'ak_second'])
  setup.config.state.connections = new Map([
    ['c1', { connector: setup.connector, activeAccount: 'ak_second' }],
  ])
  return setup
}

describe('transferFunds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sign the transaction before posting it', async () => {
    const { config, postTransaction, signTransaction } = mockSetup()

    await transferFunds(config, { fraction: 0.5, recipient: 'ak_recipient' })

    expect(signTransaction).toHaveBeenCalledTimes(1)
    expect(signTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ tx: 'tx_UNSIGNED', networkId: 'ae_uat' }),
    )
    // The signed value, never the built one.
    expect(postTransaction).toHaveBeenCalledWith({ tx: 'tx_SIGNED' })
  })

  it('takes the sender from the active account, not the first of the list', async () => {
    const { config, connector, signTransaction } = multiAccountSetup()

    await transferFunds(config, {
      fraction: 0.5,
      recipient: 'ak_recipient',
      connector: connector as any,
    })

    // Built for, sized against, and signed by the same account throughout.
    expect(buildTxAsync).toHaveBeenCalledWith(
      expect.objectContaining({ senderId: 'ak_second' }),
    )
    expect(signTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ onAccount: 'ak_second' }),
    )
  })

  it('should return the signed transaction as rawTx', async () => {
    const { config } = mockSetup()

    const result = await transferFunds(config, {
      fraction: 0.5,
      recipient: 'ak_recipient',
    })

    expect(result.rawTx).toBe('tx_SIGNED')
  })

  it('should populate blockHash, blockHeight and tx on the default path', async () => {
    const { config } = mockSetup()

    const result = await transferFunds(config, {
      fraction: 0.5,
      recipient: 'ak_recipient',
    })

    expect(result).toEqual({
      hash: 'th_1',
      rawTx: 'tx_SIGNED',
      blockHash: 'kh_1',
      blockHeight: 42,
      tx: { type: 'SpendTx' },
    })
  })

  it('should not wait when waitMined is false', async () => {
    const { config, node } = mockSetup()

    const result = await transferFunds(config, {
      fraction: 0.5,
      recipient: 'ak_recipient',
      waitMined: false,
    })

    expect(node.getTransactionByHash).not.toHaveBeenCalled()
    expect(result).toEqual({ hash: 'th_1', rawTx: 'tx_SIGNED' })
  })

  it('should throw when the connector cannot sign', async () => {
    const { config, connector } = mockSetup()
    delete (connector as any).signTransaction

    await expect(
      transferFunds(config, { fraction: 0.5, recipient: 'ak_recipient' }),
    ).rejects.toThrow(/Connector does not support transaction signing/)
  })

  it('should be a function', () => {
    expect(typeof transferFunds).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(transferFunds.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when fraction is less than 0', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    } as any

    await expect(
      transferFunds(mockConfig, { fraction: -0.5, recipient: 'ak_test' }),
    ).rejects.toThrow(/Invalid fraction/)
  })

  it('should throw when fraction is greater than 1', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    } as any

    await expect(
      transferFunds(mockConfig, { fraction: 1.5, recipient: 'ak_test' }),
    ).rejects.toThrow(/Invalid fraction/)
  })

  it('should throw when no connector is found', async () => {
    const mockConfig = {
      state: {
        connections: new Map(),
        current: undefined,
      },
    } as any

    await expect(
      transferFunds(mockConfig, { fraction: 0.5, recipient: 'ak_test' }),
    ).rejects.toThrow(/No connector found/)
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})
