import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockNode } = vi.hoisted(() => ({
  mockNode: {
    getAccountByPubkey: vi.fn(),
    postTransaction: vi.fn(),
  },
}))

// Deliberately a partial mock: only `Node` is stubbed, so `buildTx` runs for
// real and this suite sees serialisation defects a wholesale SDK mock hides.
vi.mock('@aeternity/aepp-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aeternity/aepp-sdk')>()
  return {
    ...actual,
    Node: vi.fn().mockImplementation(() => mockNode),
  }
})

import {
  decode,
  type Encoded,
  Encoding,
  encode,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk'
import { mock } from '../connectors/mock'
import { createConfig } from '../createConfig'
import { testnet } from '../types/network'
import { connect } from './connect'
import { spend } from './spend'

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
