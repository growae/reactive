import { commitmentHash, ensureName, Name } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants.js'
import type { Config } from '../createConfig.js'
import {
  BaseError,
  type BaseErrorType,
  type ErrorType,
} from '../errors/base.js'
import { connectorAccount } from '../utils/connectorAccount.js'

export type PreclaimNameParameters = {
  name: string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type PreclaimNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
  /** Pass this straight to `claimName` — the sdk generated it. */
  salt: number
  commitmentId: string
}

export type PreclaimNameErrorType = BaseErrorType | ErrorType

export class PreclaimNameNoAccountError extends BaseError {
  override name = 'PreclaimNameNoAccountError'
  constructor() {
    super('Cannot preclaim name without a connected account.')
  }
}

export async function preclaimName(
  config: Config,
  parameters: PreclaimNameParameters,
): Promise<PreclaimNameReturnType> {
  const { name, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new PreclaimNameNoAccountError()
  }

  ensureName(name)

  const nameInstance = new Name(name, {
    onNode: node,
    onAccount: connectorAccount(connection),
  })

  // `ttl` reaches the transaction builder and the NamePreclaimTx schema at
  // runtime, but not through the published type: the sdk derives its name
  // option types with `Omit` over the `TxParamsAsync` union, and `Omit` on a
  // union keeps only the keys every member shares, which `ttl` is not. The cast
  // is narrowed to that one option type rather than `any`.
  const result = await nameInstance.preclaim({
    ttl: ttl ?? DEFAULT_TTL,
  } as Parameters<Name['preclaim']>[0])

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
    salt: result.nameSalt,
    // The preclaim result carries no commitment id — it is not a field of the
    // transaction the node returns. It is derived from the name and the salt,
    // which is exactly how the sdk built the one it posted.
    commitmentId: commitmentHash(name, result.nameSalt),
  }
}
