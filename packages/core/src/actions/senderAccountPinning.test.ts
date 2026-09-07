import { buildTx, MemoryAccount, Tag, unpackTx } from '@aeternity/aepp-sdk'
import { beforeEach, describe, expect, it } from 'vitest'
import { memory } from '../connectors/memory.js'
import { createConfig } from '../createConfig.js'
import { ConnectorAccountUnavailableError } from '../errors/connector.js'
import { mainnet, testnet } from '../types/network.js'
import { connect } from './connect.js'
import { signTransaction } from './signTransaction.js'
import { switchActiveAccount } from './switchActiveAccount.js'

/**
 * The sender pin, proved with real key material.
 *
 * `switchActiveAccount` is public API and sets `Connection.activeAccount` to
 * any account of the connection. Nothing propagated that to the connector, so
 * every connector signed with the account it had chosen for itself — the
 * first one — while the action built the transaction for the active one. On
 * the node that is a bare signature error; where the connector holds both keys
 * it is worse, because the signature is valid and the wrong account's funds
 * move with nothing anywhere reporting a problem.
 *
 * Nothing is mocked here. Two real accounts, a real `SpendTx`, and the
 * signature read back off the wire: a suite that asserted only "the connector
 * was called with `onAccount`" would pass against a connector that accepted
 * the parameter and ignored it, which is the defect being fixed.
 */

let accountA: MemoryAccount
let accountB: MemoryAccount

function connectedConfig() {
  return createConfig({
    networks: [testnet, mainnet],
    connectors: [
      memory({
        accounts: [
          { secretKey: accountA.secretKey },
          { secretKey: accountB.secretKey },
        ],
      }),
    ],
    storage: null,
  })
}

/** A `SpendTx` from `sender`, the transaction the signature must match. */
function spendTxFrom(sender: MemoryAccount) {
  return buildTx({
    tag: Tag.SpendTx,
    senderId: sender.address,
    recipientId: accountA.address,
    amount: 1n,
    nonce: 1,
    ttl: 0,
  })
}

/** The signature bytes the node would check, taken off the signed envelope. */
function signatureOf(signedTx: string): string {
  const { signatures } = unpackTx(
    signedTx as `tx_${string}`,
    Tag.SignedTx,
  ) as unknown as { signatures: Uint8Array[] }
  expect(signatures).toHaveLength(1)
  return Buffer.from(signatures[0]!).toString('hex')
}

describe('sender account pinning', () => {
  beforeEach(() => {
    accountA = MemoryAccount.generate()
    accountB = MemoryAccount.generate()
  })

  it('signs with the switched-to account, not the connector first one', async () => {
    const config = connectedConfig()
    await connect(config, { connector: config.connectors[0]! })

    switchActiveAccount(config, { account: accountB.address })

    const tx = spendTxFrom(accountB)
    const signed = await signTransaction(config, { tx, networkId: testnet.id })

    // The signature the account itself produces is the only thing the node
    // accepts for a transaction sent from it.
    const fromB = await accountB.signTransaction(tx as `tx_${string}`, {
      networkId: testnet.id,
    })
    expect(signatureOf(signed)).toBe(signatureOf(fromB))
  })

  it('is a different signature from the one the old default produced', async () => {
    const config = connectedConfig()
    await connect(config, { connector: config.connectors[0]! })
    switchActiveAccount(config, { account: accountB.address })

    const tx = spendTxFrom(accountB)
    const signed = await signTransaction(config, { tx, networkId: testnet.id })

    // Guards the assertion above against a connector that pins nothing and
    // happens to agree: `accounts[0]` is what shipped, and it is not this.
    const fromA = await accountA.signTransaction(tx as `tx_${string}`, {
      networkId: testnet.id,
    })
    expect(signatureOf(signed)).not.toBe(signatureOf(fromA))
  })

  it('still signs with the active account when none was switched to', async () => {
    const config = connectedConfig()
    await connect(config, { connector: config.connectors[0]! })

    const tx = spendTxFrom(accountA)
    const signed = await signTransaction(config, { tx, networkId: testnet.id })

    const fromA = await accountA.signTransaction(tx as `tx_${string}`, {
      networkId: testnet.id,
    })
    expect(signatureOf(signed)).toBe(signatureOf(fromA))
  })

  it('honours an account named explicitly over the active one', async () => {
    const config = connectedConfig()
    await connect(config, { connector: config.connectors[0]! })

    const tx = spendTxFrom(accountB)
    const signed = await signTransaction(config, {
      tx,
      networkId: testnet.id,
      onAccount: accountB.address,
    })

    const fromB = await accountB.signTransaction(tx as `tx_${string}`, {
      networkId: testnet.id,
    })
    expect(signatureOf(signed)).toBe(signatureOf(fromB))
  })

  it('throws for an account the connector does not hold, never falls back', async () => {
    const config = connectedConfig()
    await connect(config, { connector: config.connectors[0]! })

    const stranger = MemoryAccount.generate()
    await expect(
      signTransaction(config, {
        tx: spendTxFrom(accountA),
        networkId: testnet.id,
        onAccount: stranger.address,
      }),
    ).rejects.toThrow(ConnectorAccountUnavailableError)
  })
})
