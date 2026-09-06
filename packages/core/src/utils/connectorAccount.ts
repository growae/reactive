/**
 * An `AccountBase` over a connector.
 *
 * Everything in `@aeternity/aepp-sdk` that signs — `Name`, `Contract`,
 * `sendTransaction` — takes `onAccount: AccountBase`: an object carrying the
 * address and doing the signing. A connector is the same thing in a different
 * shape; it holds the key material, or the wallet that does, and exposes
 * `signTransaction` and `signMessage`. This is the adapter between the two.
 *
 * Its absence is why three AENS actions passed `connection.activeAccount` — a
 * plain address string — as `onAccount` behind an `as any`. The sdk stores the
 * constructor options without looking at them, so nothing failed until the
 * first call, where `sendTransaction` reads `onAccount.address`, gets
 * `undefined`, and the node request is built without a sender.
 *
 * Internal: this module is re-exported from no barrel and no entry point. The
 * adapter is an implementation detail of the actions that reach the sdk's
 * account-taking classes, not a surface consumers write against.
 */

import {
  AccountBase,
  type Encoded,
  Encoding,
  isAddressValid,
  isEncoded,
} from '@aeternity/aepp-sdk'
import type { Connection, Connector } from '../createConfig.js'
import { BaseError } from '../errors/base.js'

export class ConnectorAccountAddressError extends BaseError {
  override name = 'ConnectorAccountAddressError'
  constructor(address: string) {
    super('The connected account is not a valid æternity address.', {
      metaMessages: [`Received: ${address}`],
    })
  }
}

export class ConnectorSigningUnsupportedError extends BaseError {
  override name = 'ConnectorSigningUnsupportedError'
  constructor(connectorName: string, capability: string) {
    super(`Connector "${connectorName}" does not support ${capability}.`)
  }
}

export class ConnectorSignatureError extends BaseError {
  override name = 'ConnectorSignatureError'
  constructor(connectorName: string, capability: string, expected: string) {
    super(`Connector "${connectorName}" returned a malformed ${capability}.`, {
      metaMessages: [`Expected ${expected}.`],
    })
  }
}

const HEX = /^(?:[0-9a-fA-F]{2})*$/

/**
 * Every connector in this repository returns a signature as a hex string —
 * `memory`, `superhero`, `webExtension`, `iframe`, `ledger` and `metamaskSnap`
 * alike — while `AccountBase.signMessage` is defined to return the bytes.
 * `Buffer.from(s, 'hex')` truncates silently at the first non-hex character, so
 * the string is checked rather than coerced: a wallet returning something else
 * is a defect worth a legible error at the boundary.
 */
function signatureBytes(
  signature: string,
  connectorName: string,
  capability: string,
): Uint8Array {
  if (!HEX.test(signature)) {
    throw new ConnectorSignatureError(
      connectorName,
      capability,
      'a hex-encoded signature',
    )
  }
  const bytes = new Uint8Array(signature.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(signature.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export type ConnectorAccountParameters = {
  /** The address the connector signs for — `Connection['activeAccount']`. */
  address: string
  connector: Connector
  /** Network id to sign against when the caller names none. */
  networkId: string
}

export class ConnectorAccount extends AccountBase {
  override readonly address: Encoded.AccountAddress

  readonly #connector: Connector
  readonly #networkId: string

  constructor({ address, connector, networkId }: ConnectorAccountParameters) {
    super()
    if (!isAddressValid(address)) {
      throw new ConnectorAccountAddressError(address)
    }
    this.address = address
    this.#connector = connector
    this.#networkId = networkId
  }

  override async signTransaction(
    tx: Encoded.Transaction,
    options: Parameters<AccountBase['signTransaction']>[1] = {},
  ): Promise<Encoded.Transaction> {
    const { signTransaction } = this.#connector
    if (!signTransaction) {
      throw new ConnectorSigningUnsupportedError(
        this.#connector.name,
        'transaction signing',
      )
    }

    // The sdk passes the network id it read off the node; the connection's own
    // is the fallback for a caller that reaches the account directly.
    const signed = await signTransaction.call(this.#connector, {
      tx,
      networkId: options.networkId ?? this.#networkId,
      ...(options.innerTx != null ? { innerTx: options.innerTx } : {}),
    })

    if (!isEncoded(signed, Encoding.Transaction)) {
      throw new ConnectorSignatureError(
        this.#connector.name,
        'signed transaction',
        'a tx_-prefixed encoded transaction',
      )
    }
    return signed
  }

  override async signMessage(message: string): Promise<Uint8Array> {
    const { signMessage } = this.#connector
    if (!signMessage) {
      throw new ConnectorSigningUnsupportedError(
        this.#connector.name,
        'message signing',
      )
    }

    const signature = await signMessage.call(this.#connector, {
      message,
      onAccount: this.address,
    })
    return signatureBytes(signature, this.#connector.name, 'signature')
  }

  override async signDelegation(
    delegation: Encoded.Bytearray,
    options: Parameters<AccountBase['signDelegation']>[1] = {},
  ): Promise<Encoded.Signature> {
    // Delegation signing is not on `CreateConnectorFn`; the `signDelegation`
    // action reads it off the connector the same way, and a connector without
    // it is told apart from one with it here rather than at the wallet.
    const signDelegation = (
      this.#connector as Connector & {
        signDelegation?: (
          delegation: string,
          options: { networkId?: string | undefined; onAccount?: string },
        ) => Promise<string>
      }
    ).signDelegation
    if (!signDelegation) {
      throw new ConnectorSigningUnsupportedError(
        this.#connector.name,
        'delegation signing',
      )
    }

    const signature = await signDelegation.call(this.#connector, delegation, {
      networkId: options.networkId ?? this.#networkId,
      onAccount: this.address,
    })

    if (!isEncoded(signature, Encoding.Signature)) {
      throw new ConnectorSignatureError(
        this.#connector.name,
        'delegation signature',
        'an sg_-prefixed encoded signature',
      )
    }
    return signature
  }

  /**
   * A connector signs a transaction, a message or a delegation and nothing
   * else — there is no raw-blob or typed-data channel in the protocol between
   * this library and a wallet. These three throw rather than approximate one:
   * `signTypedData` over `signMessage` would hand back a signature over a
   * different payload than the caller asked for, which no consumer can detect.
   */
  override async signTypedData(): Promise<Encoded.Signature> {
    throw new ConnectorSigningUnsupportedError(
      this.#connector.name,
      'typed-data signing',
    )
  }

  /** @deprecated the sdk's own deprecation — `unsafeSign` is the replacement. */
  override async sign(): Promise<Uint8Array> {
    return this.unsafeSign()
  }

  override async unsafeSign(): Promise<Uint8Array> {
    throw new ConnectorSigningUnsupportedError(
      this.#connector.name,
      'raw data signing',
    )
  }
}

/** The account a connected `Connection` signs with. */
export function connectorAccount(connection: Connection): ConnectorAccount {
  return new ConnectorAccount({
    address: connection.activeAccount,
    connector: connection.connector,
    networkId: connection.networkId,
  })
}
