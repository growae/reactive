import { ensureName, Name, produceNameId } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants.js'
import type { Config } from '../createConfig.js'
import {
  BaseError,
  type BaseErrorType,
  type ErrorType,
} from '../errors/base.js'
import { connectorAccount } from '../utils/connectorAccount.js'

export type ClaimNameParameters = {
  name: string
  /**
   * Salt from the matching `preclaimName` call. Since Ceres a name can be
   * claimed without preclaiming, so this is optional; the node then reads the
   * protocol's zero salt.
   */
  salt?: number
  nameFee?: bigint | string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type ClaimNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
  nameId: string
}

export type ClaimNameErrorType = BaseErrorType | ErrorType

export class ClaimNameNoAccountError extends BaseError {
  override name = 'ClaimNameNoAccountError'
  constructor() {
    super('Cannot claim name without a connected account.')
  }
}

export async function claimName(
  config: Config,
  parameters: ClaimNameParameters,
): Promise<ClaimNameReturnType> {
  const { name, salt, nameFee, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new ClaimNameNoAccountError()
  }

  ensureName(name)

  const nameInstance = new Name(name, {
    onNode: node,
    onAccount: connectorAccount(connection),
  })

  // `ttl` reaches the transaction builder and the NameClaimTx schema at
  // runtime, but not through the published type: the sdk derives its name
  // option types with `Omit` over the `TxParamsAsync` union, and `Omit` on a
  // union keeps only the keys every member shares, which `ttl` is not. The cast
  // is narrowed to that one option type rather than `any`.
  const result = await nameInstance.claim({
    ...(salt != null ? { nameSalt: salt } : {}),
    ...(nameFee != null ? { nameFee: nameFee.toString() } : {}),
    ttl: ttl ?? DEFAULT_TTL,
  } as Parameters<Name['claim']>[0])

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
    nameId: produceNameId(name),
  }
}
