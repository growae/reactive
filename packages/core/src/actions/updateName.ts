import { ensureName, Name } from '@aeternity/aepp-sdk'
import {
  DEFAULT_CLIENT_TTL,
  DEFAULT_NAME_TTL,
  DEFAULT_TTL,
} from '../constants.js'
import type { Config } from '../createConfig.js'
import {
  BaseError,
  type BaseErrorType,
  type ErrorType,
} from '../errors/base.js'
import { connectorAccount } from '../utils/connectorAccount.js'

export type NamePointer = {
  key: string
  id: string
}

export type UpdateNameParameters = {
  name: string
  pointers: NamePointer[]
  /** Merge with the pointers already on the name instead of replacing them. */
  extendPointers?: boolean
  /** Name TTL in blocks. Defaults to 180000, the protocol maximum. */
  nameTtl?: number
  /** Client cache TTL in seconds. Defaults to 3600. */
  clientTtl?: number
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type UpdateNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export type UpdateNameErrorType = BaseErrorType | ErrorType

export class UpdateNameNoAccountError extends BaseError {
  override name = 'UpdateNameNoAccountError'
  constructor() {
    super('Cannot update name without a connected account.')
  }
}

export async function updateName(
  config: Config,
  parameters: UpdateNameParameters,
): Promise<UpdateNameReturnType> {
  const { name, pointers, extendPointers, nameTtl, clientTtl, ttl, networkId } =
    parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new UpdateNameNoAccountError()
  }

  ensureName(name)

  const nameInstance = new Name(name, {
    onNode: node,
    onAccount: connectorAccount(connection),
  })

  // The sdk types a pointer id as an encoded address or bytearray, and this
  // action takes plain strings. Validating them here would reject inputs the
  // previous implementation posted, so the cast stands rather than the check:
  // the node is what refuses a malformed pointer, as it did before.
  const pointersMap = Object.fromEntries(
    pointers.map(({ key, id }) => [key, id]),
  ) as Parameters<Name['update']>[0]

  // `nameTtl`, `clientTtl` and `ttl` reach the transaction builder and the
  // NameUpdateTx schema at runtime, but not through the published type: the sdk
  // derives its name option types with `Omit` over the `TxParamsAsync` union,
  // and `Omit` on a union keeps only the keys every member shares, which these
  // three are not. The cast is narrowed to that one option type rather than
  // `any`; `extendPointers` is on the published type and is checked.
  const result = await nameInstance.update(pointersMap, {
    ...(extendPointers != null ? { extendPointers } : {}),
    nameTtl: nameTtl ?? DEFAULT_NAME_TTL,
    clientTtl: clientTtl ?? DEFAULT_CLIENT_TTL,
    ttl: ttl ?? DEFAULT_TTL,
  } as Parameters<Name['update']>[1])

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
