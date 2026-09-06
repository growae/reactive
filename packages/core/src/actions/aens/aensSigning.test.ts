import { beforeEach, describe, expect, it, vi } from 'vitest'

const { nodeRef } = vi.hoisted(() => ({
  nodeRef: { current: undefined as unknown },
}))

// Deliberately a partial mock: only `Node` is stubbed, so `Name`, the
// transaction builder and the signing path all run for real and this suite sees
// what the sdk actually asks the account for.
vi.mock('@aeternity/aepp-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aeternity/aepp-sdk')>()
  return {
    ...actual,
    Node: vi.fn().mockImplementation(() => nodeRef.current),
  }
})

import {
  type Encoded,
  getMinimumNameFee,
  MemoryAccount,
  produceNameId,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk'
import { memory } from '../../connectors/memory.js'
import { createConfig } from '../../createConfig.js'
import { testnet } from '../../types/network.js'
import { connect } from '../connect.js'
import { bidName } from './bidName.js'
import { revokeName } from './revokeName.js'
import { transferName } from './transferName.js'

/**
 * The sdk types `unpackTx` as an intersection over the whole `TxUnpacked`
 * union, which does not narrow on field access, so name the fields asserted on.
 */
type UnpackedNameTx = {
  accountId: string
  nameId: string
  recipientId: string
  nameFee: string
}

function unpackNameTx(tx: Encoded.Transaction, tag: Tag): UnpackedNameTx {
  return unpackTx(tx, tag as never) as unknown as UnpackedNameTx
}

const NAME = 'testname.chain'
const AUCTION_NAME = 'short.chain'
/** The sdk refuses a bid below the name's minimum, so bid exactly that. */
const BID_FEE = getMinimumNameFee(AUCTION_NAME).toFixed()
const RECIPIENT = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'

const account = MemoryAccount.generate()

function createNodeMock() {
  return {
    getAccountNextNonce: vi.fn().mockResolvedValue({ nextNonce: 7 }),
    getAccountByPubkey: vi.fn().mockResolvedValue({
      id: account.address,
      balance: 10000000000000000000n,
      nonce: 6,
    }),
    getCurrentKeyBlockHeight: vi.fn().mockResolvedValue({ height: 100 }),
    getRecentGasPrices: vi
      .fn()
      .mockResolvedValue([{ minGasPrice: 1000000000n, utilization: 10 }]),
    getHeight: vi.fn().mockResolvedValue(100),
    getNetworkId: vi.fn().mockResolvedValue(testnet.id),
    getNodeInfo: vi.fn().mockResolvedValue({
      consensusProtocolVersion: 6,
      nodeNetworkId: testnet.id,
    }),
    postTransaction: vi.fn().mockResolvedValue({ txHash: 'th_mockTxHash123' }),
  }
}

async function createConnectedConfig() {
  const config = createConfig({
    networks: [testnet],
    connectors: [memory({ accounts: [{ secretKey: account.secretKey }] })],
    storage: null,
  })
  await connect(config, { connector: config.connectors[0]! })
  return config
}

/**
 * The sdk verifies a transaction before it posts it, and that step builds its
 * own `Node` from the host rather than reusing the one it was handed, so it
 * cannot be reached with a node mock. Everything this suite asserts on — the
 * account the transaction is built for, and the connector call that signs it —
 * happens before it, so the run is driven to completion or failure and the
 * evidence is read off the connector.
 */
async function signedTx(run: Promise<unknown>): Promise<Encoded.Transaction> {
  await run.catch(() => undefined)
  const call = signTransaction.mock.calls[0]
  expect(call).toBeDefined()
  return call![0].tx as Encoded.Transaction
}

let signTransaction: ReturnType<typeof vi.fn>

describe('aens signing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nodeRef.current = createNodeMock()
  })

  it('revokeName signs through the connector, for the connected account', async () => {
    const config = await createConnectedConfig()
    const connection = config.state.connections.get(config.state.current!)!
    signTransaction = vi.spyOn(
      connection.connector,
      'signTransaction',
    ) as unknown as ReturnType<typeof vi.fn>

    const tx = await signedTx(revokeName(config, { name: NAME }))

    expect(signTransaction).toHaveBeenCalledTimes(1)
    expect(signTransaction.mock.calls[0]![0]).toMatchObject({
      networkId: testnet.id,
    })

    const unpacked = unpackNameTx(tx, Tag.NameRevokeTx)
    expect(unpacked.accountId).toBe(account.address)
    expect(unpacked.nameId).toBe(produceNameId(NAME))
  })

  it('transferName signs through the connector, for the connected account', async () => {
    const config = await createConnectedConfig()
    const connection = config.state.connections.get(config.state.current!)!
    signTransaction = vi.spyOn(
      connection.connector,
      'signTransaction',
    ) as unknown as ReturnType<typeof vi.fn>

    const tx = await signedTx(
      transferName(config, { name: NAME, recipient: RECIPIENT }),
    )

    const unpacked = unpackNameTx(tx, Tag.NameTransferTx)
    expect(unpacked.accountId).toBe(account.address)
    expect(unpacked.recipientId).toBe(RECIPIENT)
  })

  it('bidName signs through the connector, for the connected account', async () => {
    const config = await createConnectedConfig()
    const connection = config.state.connections.get(config.state.current!)!
    signTransaction = vi.spyOn(
      connection.connector,
      'signTransaction',
    ) as unknown as ReturnType<typeof vi.fn>

    const tx = await signedTx(
      bidName(config, { name: AUCTION_NAME, nameFee: BID_FEE }),
    )

    const unpacked = unpackNameTx(tx, Tag.NameClaimTx)
    expect(unpacked.accountId).toBe(account.address)
    expect(unpacked.nameFee).toBe(BID_FEE)
  })
})
