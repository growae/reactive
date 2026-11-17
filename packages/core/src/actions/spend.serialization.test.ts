import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockNode } = vi.hoisted(() => ({
  mockNode: {
    getAccountByPubkey: vi.fn(),
    getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 1000 }),
    postTransaction: vi.fn(),
  },
}))

// The SDK is an independent byte reference for the Rust-backed action.
vi.mock('../node.js', () => ({
  NodeClient: vi.fn().mockImplementation(() => mockNode),
}))

import {
  buildTx,
  decode,
  type Encoded,
  Encoding,
  encode,
  produceNameId,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk'
import { mock } from '../connectors/mock.js'
import { createConfig } from '../createConfig.js'
import { testnet } from '../types/network.js'
import { connect } from './connect.js'
import { spend } from './spend.js'

const SENDER = 'ak_2K7ngGLmhQza45Dtw8352T8kTDrHBEWf9KFqc5pNtJ6G2DQ7uS'
const RECIPIENT = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'

async function createConnectedConfig() {
  const config = createConfig({
    networks: [testnet],
    connectors: [mock({ accounts: [SENDER] })],
    storage: null,
  })
  await connect(config, { connector: config.connectors[0]! })
  return config
}

/**
 * The SDK types `unpackTx` as an intersection over the whole `TxUnpacked`
 * union, which does not narrow on field access, so name the fields asserted on.
 */
type UnpackedSpendTx = {
  senderId: Encoded.AccountAddress
  recipientId: Encoded.AccountAddress
  amount: string
  ttl: number
  payload: Encoded.Bytearray
}

/** The mock connector signs by prefixing, so strip that to get the built tx. */
function unpackSpendTx(rawTx: string): UnpackedSpendTx {
  const tx = rawTx.replace(/^signed_/, '') as Encoded.Transaction
  return unpackTx(tx, Tag.SpendTx) as unknown as UnpackedSpendTx
}

describe('spend transaction serialisation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNode.getAccountByPubkey.mockResolvedValue({
      balance: '10000000000000000000',
      nonce: 5,
    })
    mockNode.postTransaction.mockResolvedValue({ txHash: 'th_mockTxHash123' })
  })

  it('builds a valid transaction when the caller passes no payload', async () => {
    const config = await createConnectedConfig()

    const result = await spend(config, {
      recipient: RECIPIENT,
      amount: 1000000000000000000n,
    })

    const unpacked = unpackSpendTx(result.rawTx)
    expect(unpacked.ttl).toBe(1300)
    expect(unpacked.senderId).toBe(SENDER)
    expect(unpacked.recipientId).toBe(RECIPIENT)
    expect(BigInt(unpacked.amount)).toBe(1000000000000000000n)
    expect(decode(unpacked.payload)).toHaveLength(0)
  })

  it('builds a valid transaction when the caller passes an empty payload', async () => {
    const config = await createConnectedConfig()

    const result = await spend(config, {
      recipient: RECIPIENT,
      amount: 1000000000000000000n,
      payload: '',
    })

    expect(decode(unpackSpendTx(result.rawTx).payload)).toHaveLength(0)
  })

  it('matches the reference bytes including the inferred fee', async () => {
    const config = await createConnectedConfig()
    const amount = 10n ** 20n
    const result = await spend(config, {
      recipient: RECIPIENT,
      amount,
      options: { ttl: 18 },
    })
    expect(result.rawTx).toBe(
      `signed_${buildTx({
        tag: Tag.SpendTx,
        senderId: SENDER,
        recipientId: RECIPIENT,
        amount,
        nonce: 6,
        ttl: 18,
      })}`,
    )
  })

  it('rejects an insufficient explicit fee before signing or posting', async () => {
    const config = await createConnectedConfig()
    await expect(
      spend(config, { recipient: RECIPIENT, amount: 1n, options: { fee: 1n } }),
    ).rejects.toThrow(/fee/i)
    expect(mockNode.postTransaction).not.toHaveBeenCalled()
  })

  it('addresses an AENS recipient using its wire name ID', async () => {
    const config = await createConnectedConfig()
    const result = await spend(config, {
      recipient: 'recipient.chain',
      amount: 1n,
    })
    expect(unpackSpendTx(result.rawTx).recipientId).toBe(
      produceNameId('recipient.chain'),
    )
  })

  it('keeps an explicitly-passed payload', async () => {
    const config = await createConnectedConfig()
    const payload = encode(
      new TextEncoder().encode('hello'),
      Encoding.Bytearray,
    )

    const result = await spend(config, {
      recipient: RECIPIENT,
      amount: 1000000000000000000n,
      payload,
    })

    expect(unpackSpendTx(result.rawTx).payload).toBe(payload)
  })
})
